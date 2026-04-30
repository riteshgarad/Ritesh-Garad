import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const fullPrompt = `
        You are the AI Assistant for Garad Foundation, a youth-led NGO from Maharashtra, India. 
        Be helpful, friendly, and concise. Use Markdown for formatting.
        
        Live Data Context:
        ${context}
        
        User asks: ${prompt}
      `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    res.status(500).json({ error: error.message });
  }
}
