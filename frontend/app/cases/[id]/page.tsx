"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
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

type Case = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  log_id: string;
};

type CSVData = {
  [key: string]: string | number;
}[];

export default function CaseDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [csvData, setCSVData] = useState<CSVData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!caseData?.log_id) return;

    const channel = supabase
      .channel(`log-${caseData.log_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "storage",
          table: "objects",
          filter: `name=eq:${caseData.log_id}.csv`,
        },
        async () => {
          // Refetch CSV data when the file changes
          await fetchCSVData(caseData.log_id);
        }
      )
      .subscribe();

    return channel;
  };

  const fetchCSVData = async (logId: string) => {
    try {
      // Check if we have access to the file first
      const { data: fileInfo, error: fileError } = await supabase.storage
        .from("logs")
        .list("", {
          limit: 1,
          search: `${logId}.csv`,
        });

      if (fileError) {
        throw fileError;
      }

      if (!fileInfo || fileInfo.length === 0) {
        throw new Error("Log file not found");
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("logs")
        .download(`${logId}.csv`);

      if (downloadError) {
        if (downloadError.message.includes("storage/permission_denied")) {
          throw new Error("You do not have permission to access this log file");
        }
        throw downloadError;
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
        const timeA = new Date(a.timestamp as string).getTime();
        const timeB = new Date(b.timestamp as string).getTime();
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

      // Fetch CSV data if log_id exists
      if (caseData.log_id) {
        await fetchCSVData(caseData.log_id);
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
            <CardTitle>{caseData?.title}</CardTitle>
            <CardDescription>
              Created on{" "}
              {new Date(caseData?.created_at || "").toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{caseData?.description}</p>
            {caseData?.log_id && (
              <p className="text-sm text-gray-500 mt-2">
                Log ID: {caseData.log_id}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Chart Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>
                Time series visualization of IoT data
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

          {/* CSV Data Table */}
          <Card>
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
