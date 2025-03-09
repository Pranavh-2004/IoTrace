import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topK: 40,
    topP: 0.95,
  },
});

export async function analyzeLogsWithGemini(logs: any[]) {
  try {
    // Prepare a more concise version of the logs for the prompt
    const logSummary = logs.map((log) => ({
      timestamp: log.timestamp,
      component: log.component || log.package || "unknown",
      // Include other relevant fields but keep the data concise
      ...Object.entries(log)
        .filter(([key]) => !["timestamp", "component", "package"].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    }));

    // Ensure the log summary string is not too large
    const logSummaryStr = JSON.stringify(logSummary, null, 2);
    const truncatedLogs =
      logSummaryStr.length > 10000
        ? logSummaryStr.substring(0, 10000) + "... (truncated for length)"
        : logSummaryStr;

    const prompt = `Analyze these IoT device logs and provide insights. Focus on:
1. Patterns in component activity
2. Notable events or anomalies
3. Time-based patterns
4. Component interactions
5. Key statistics

Logs data:
${truncatedLogs}

Please provide a detailed but concise analysis that can be used in an evidence report. Format the response in clear sections.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing logs with Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`AI Analysis Error: ${error.message}`);
    }
    throw new Error("Failed to analyze logs with AI");
  }
}
