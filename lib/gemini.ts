import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function analyzeLogsWithGemini(logs: any[]) {
  try {
    const prompt = `Analyze these IoT device logs and provide insights. Focus on:
1. Patterns in component activity
2. Notable events or anomalies
3. Time-based patterns
4. Component interactions
5. Key statistics

Logs data:
${JSON.stringify(logs, null, 2)}

Please provide a detailed analysis that can be used in an evidence report.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing logs with Gemini:", error);
    throw error;
  }
}
