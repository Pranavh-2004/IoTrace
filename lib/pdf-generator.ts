import PDFDocument from "pdfkit";

export async function generateEvidencePDF(
  caseDetails: {
    title: string;
    description: string;
    created_at: string;
    id: string;
  },
  logs: any[],
  analysis: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .fontSize(24)
        .text("IoT Log Evidence Report", { align: "center" })
        .moveDown();

      // Case Details
      doc
        .fontSize(16)
        .text("Case Details")
        .moveDown()
        .fontSize(12)
        .text(`Title: ${caseDetails.title}`)
        .text(`Description: ${caseDetails.description}`)
        .text(`Created: ${new Date(caseDetails.created_at).toLocaleString()}`)
        .text(`Case ID: ${caseDetails.id}`)
        .moveDown();

      // Log Summary
      doc
        .fontSize(16)
        .text("Log Summary")
        .moveDown()
        .fontSize(12)
        .text(`Total Log Entries: ${logs.length}`)
        .text(
          `Time Range: ${new Date(
            logs[0].timestamp
          ).toLocaleString()} - ${new Date(
            logs[logs.length - 1].timestamp
          ).toLocaleString()}`
        )
        .moveDown();

      // AI Analysis
      doc
        .fontSize(16)
        .text("AI Analysis")
        .moveDown()
        .fontSize(12)
        .text(analysis, { align: "justify" })
        .moveDown();

      // Component Statistics
      const componentStats = logs.reduce((acc: Record<string, number>, log) => {
        const component = String(log.component || log.package || "unknown");
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {});

      doc.fontSize(16).text("Component Statistics").moveDown().fontSize(12);

      Object.entries(componentStats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([component, count]) => {
          const percentage = ((count / logs.length) * 100).toFixed(1);
          doc.text(`${component}: ${count} entries (${percentage}%)`);
        });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
