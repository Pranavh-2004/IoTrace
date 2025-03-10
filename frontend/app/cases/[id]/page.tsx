"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, ArrowLeft, FileDown, Loader2 } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { analyzeLogsWithGemini } from "@/lib/gemini";
import { generateEvidencePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

type Case = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  log_id: string;
  case_id: string;
};

type CSVData = {
  timestamp: string;
  component?: string;
  package?: string;
  [key: string]: string | number | undefined;
}[];

export default function CaseDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [csvData, setCSVData] = useState<CSVData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchCaseDetails();
    const subscription = setupRealtimeSubscription();
    return () => {
      subscription?.unsubscribe();
    };
  }, [id]);

  const checkAuth = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) {
      router.push("/login");
      return;
    }
  };

  const setupRealtimeSubscription = () => {
    if (!caseData) return;

    // Subscribe to both possible file patterns
    const fileId = caseData.log_id || caseData.id;
    const channel = supabase
      .channel(`log-${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "storage",
          table: "objects",
          filter: `name=eq:${fileId}.csv OR name=eq:case-${fileId}.csv`,
        },
        async () => {
          // Refetch CSV data when the file changes
          await fetchCSVData(fileId);
        }
      )
      .subscribe();

    return channel;
  };

  const fetchCSVData = async (fileId: string) => {
    try {
      // Try both fileId.csv and case-{fileId}.csv patterns
      const filesToCheck = [`${fileId}.csv`, `case-${fileId}.csv`];
      let fileData: Blob | null = null;
      let foundFile = false;

      for (const fileName of filesToCheck) {
        // Check if file exists
        const { data: fileInfo, error: fileError } = await supabase.storage
          .from("logs")
          .list("", {
            limit: 1,
            search: fileName,
          });

        if (!fileError && fileInfo && fileInfo.length > 0) {
          // Found the file, try to download it
          const { data, error: downloadError } = await supabase.storage
            .from("logs")
            .download(fileName);

          if (!downloadError && data) {
            fileData = data;
            foundFile = true;
            break;
          }
        }
      }

      if (!foundFile || !fileData) {
        throw new Error("Log file not found");
      }

      const text = await fileData.text();
      const result = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        console.warn("CSV parsing errors:", result.errors);
      }

      // Sort data by timestamp to ensure chronological order
      const sortedData = (result.data as CSVData).sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      setCSVData(sortedData);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching CSV data:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load log data");
      }
      setCSVData([]); // Clear any previous data
    }
  };

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();

      if (caseError) {
        if (caseError.code === "PGRST116") {
          throw new Error("Case not found");
        }
        throw caseError;
      }

      setCaseData(caseData);

      // Try fetching CSV data using either log_id or case_id
      const fileId = caseData.log_id || caseData.id;
      if (fileId) {
        await fetchCSVData(fileId);
      } else {
        setError("No log file associated with this case");
      }
    } catch (error) {
      console.error("Error fetching case details:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load case details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!caseData || !csvData.length) return;

    setIsGeneratingPDF(true);
    try {
      // Get AI analysis of the logs
      const analysis = await analyzeLogsWithGemini(csvData);

      // Generate PDF
      const pdfBuffer = await generateEvidencePDF(caseData, csvData, analysis);

      // Create and download the PDF
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `case-${caseData.id}-evidence.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated Successfully",
        description: "Your evidence report has been downloaded.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  // Get available metrics from CSV data (excluding timestamp)
  const metrics =
    csvData.length > 0
      ? Object.keys(csvData[0]).filter((key) => key !== "timestamp")
      : [];

  // Generate unique colors for each metric
  const colors = metrics.map((_, index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  });

  // Calculate component statistics with proper type safety
  const componentStats = csvData.reduce((acc: Record<string, number>, log) => {
    const component = String(log.component || log.package || "unknown");
    acc[component] = (acc[component] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top 10 components and combine the rest into "Others"
  const sortedComponents = Object.entries(componentStats).sort(
    ([, a], [, b]) => Number(b) - Number(a)
  );

  const pieChartData = sortedComponents.slice(0, 10).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  // Add "Others" category if there are more than 10 components
  if (sortedComponents.length > 10) {
    const othersValue = sortedComponents
      .slice(10)
      .reduce((sum, [, value]) => sum + Number(value), 0);

    pieChartData.push({
      name: "Others",
      value: othersValue,
    });
  }

  // Generate colors for pie chart (including potential "Others" category)
  const pieColors = pieChartData.map((_, index) => {
    // Use a gray color for "Others" category
    if (
      index === pieChartData.length - 1 &&
      pieChartData[index].name === "Others"
    ) {
      return "hsl(0, 0%, 75%)";
    }
    const hue = (index * 137.5) % 360;
    return `hsl(${Math.floor(hue)}, 70%, 50%)`;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold">IoT Log Vault</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{caseData?.title}</CardTitle>
                <CardDescription>
                  Created on{" "}
                  {new Date(caseData?.created_at || "").toLocaleDateString()}
                </CardDescription>
                <CardDescription>Case ID: {caseData?.id}</CardDescription>
              </div>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || !csvData.length}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Generate Evidence PDF
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{caseData?.description}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Chart Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Time Series Visualization</CardTitle>
              <CardDescription>
                Time series visualization of IoT data metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={csvData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Legend />
                  {metrics.map((metric, index) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={metric}
                      stroke={colors[index]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Component Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Component Distribution</CardTitle>
              <CardDescription>
                Distribution of logs across different components
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    label={false}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} logs (${(
                        (Number(value) / csvData.length) *
                        100
                      ).toFixed(1)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Raw Data Table */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>CSV data in tabular format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(csvData[0] || {}).map((header) => (
                        <TableHead
                          key={header}
                          className="capitalize sticky top-0 bg-white"
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>
                            {typeof value === "string" && value.includes("T")
                              ? new Date(value).toLocaleString()
                              : value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
