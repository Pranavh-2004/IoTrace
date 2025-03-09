import { jsPDF } from "jspdf";

export async function generateEvidencePDF(
  caseDetails: {
    title: string;
    description: string;
    created_at: string;
    id: string;
  },
  logs: any[],
  analysis: string
): Promise<ArrayBuffer> {
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - 2 * margin;

  // Helper function to add text with line breaks
  const addText = (text: string, fontSize: number, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, yPos);
    yPos += (fontSize / 4) * lines.length + 5;

    // Add some spacing after the text
    yPos += 5;

    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Title
  addText("IoT Log Evidence Report", 24, true);

  // Case Details
  addText("Case Details", 16, true);
  addText(`Title: ${caseDetails.title}`, 12);
  addText(`Description: ${caseDetails.description}`, 12);
  addText(`Created: ${new Date(caseDetails.created_at).toLocaleString()}`, 12);
  addText(`Case ID: ${caseDetails.id}`, 12);

  // Log Summary
  addText("Log Summary", 16, true);
  addText(`Total Log Entries: ${logs.length}`, 12);
  if (logs.length > 0) {
    addText(
      `Time Range: ${new Date(logs[0].timestamp).toLocaleString()} - ${new Date(
        logs[logs.length - 1].timestamp
      ).toLocaleString()}`,
      12
    );
  }

  // AI Analysis
  addText("AI Analysis", 16, true);
  addText(analysis, 12);

  // Component Statistics
  addText("Component Statistics", 16, true);
  const componentStats = logs.reduce((acc: Record<string, number>, log) => {
    const component = String(log.component || log.package || "unknown");
    acc[component] = (acc[component] || 0) + 1;
    return acc;
  }, {});

  Object.entries(componentStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([component, count]) => {
      const percentage = ((count / logs.length) * 100).toFixed(1);
      addText(`${component}: ${count} entries (${percentage}%)`, 12);
    });

  return doc.output("arraybuffer");
}
