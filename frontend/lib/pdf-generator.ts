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
  // Create PDF in portrait mode with unit points and A4 format
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  let yPos = 40;
  const margin = 40;
  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 1.2;

  // Helper function to add text with proper formatting and word wrapping
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    extraSpacing: number = 0
  ) => {
    // Check if we need a new page before adding text
    if (yPos > doc.internal.pageSize.height - margin * 2) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");

    // Split text into words and create lines that fit within maxWidth
    const words = text.split(" ");
    let currentLine = "";
    const lines: string[] = [];

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    // Calculate total height needed for this text block
    const totalHeight = lines.length * fontSize * lineHeight;

    // If this text block would cross page boundary, start a new page
    if (yPos + totalHeight > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Add each line with proper spacing
    lines.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += fontSize * lineHeight;
    });

    // Add extra spacing after the text block
    yPos += extraSpacing;
  };

  // Add section divider
  const addDivider = () => {
    if (yPos + 20 > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPos = margin;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 20;
  };

  // Title Section
  doc.setTextColor(44, 62, 80); // Dark blue color for title
  addText("IoT Log Evidence Report", 24, true, 20);
  addDivider();

  // Case Details Section
  addText("Case Details", 18, true, 10);
  doc.setTextColor(60, 60, 60); // Dark gray for content
  addText(`Title: ${caseDetails.title}`, 12, true);
  addText(`Description: ${caseDetails.description}`, 12);
  addText(`Created: ${new Date(caseDetails.created_at).toLocaleString()}`, 12);
  addText(`Case ID: ${caseDetails.id}`, 12);
  addDivider();

  // Log Summary Section
  addText("Log Summary", 18, true, 10);
  addText(`Total Log Entries: ${logs.length}`, 12);
  if (logs.length > 0) {
    const startDate = new Date(logs[0].timestamp);
    const endDate = new Date(logs[logs.length - 1].timestamp);
    addText("Time Range:", 12, true);
    addText(`Start: ${startDate.toLocaleString()}`, 12);
    addText(`End: ${endDate.toLocaleString()}`, 12);

    // Calculate duration
    const duration = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    addText(`Duration: ${hours}h ${minutes}m`, 12);
  }
  addDivider();

  // AI Analysis Section
  addText("AI Analysis", 18, true, 10);
  // Format analysis into paragraphs
  const paragraphs = analysis.split("\n").filter((p) => p.trim());
  paragraphs.forEach((paragraph) => {
    addText(paragraph.trim(), 12, false, 5);
  });
  addDivider();

  // Component Statistics Section
  addText("Component Statistics", 18, true, 10);
  const componentStats = logs.reduce((acc: Record<string, number>, log) => {
    const component = String(log.component || log.package || "unknown");
    acc[component] = (acc[component] || 0) + 1;
    return acc;
  }, {});

  // Sort components by count and format as a table
  const sortedComponents = Object.entries(componentStats).sort(
    ([, a], [, b]) => b - a
  );

  // Add table headers
  addText("Component Distribution:", 12, true, 5);

  sortedComponents.forEach(([component, count]) => {
    const percentage = ((count / logs.length) * 100).toFixed(1);
    const componentText = `• ${component}: ${count} entries (${percentage}%)`;
    addText(componentText, 12, false, 2);
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}
