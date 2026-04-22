import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function askAssistant(prompt: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the AI Assistant for Garad Foundation, a youth-led NGO from Maharashtra, India. 
        Be helpful, friendly, and concise. Use Markdown for formatting.
        
        Here is the current live data context of the NGO:
        ${context}
        
        User asks: ${prompt}
      `,
    });

    return response.text || "I was unable to generate a response. Please try again.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting to the AI service. Please verify your API key configuration.";
  }
}
