import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context } = req.body;
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`
      You are the AI Assistant for Garad Foundation, a youth-led NGO from Maharashtra, India. 
      Be helpful, friendly, and concise. Use Markdown for formatting.
      
      Live Data Context:
      ${context}
      
      User asks: ${prompt}
    `);

    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    res.status(500).json({ error: error.message });
  }
}
