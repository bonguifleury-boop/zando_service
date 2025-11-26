import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Safely initialize the client only if the key exists to avoid immediate crash on load if missing
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateBusinessInsight = async (prompt: string, contextData: string): Promise<string> => {
  if (!ai) return "API Key is missing. Please configure the environment.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a business intelligence assistant for a retail management system. 
      Analyze the following context data and answer the user's question accurately and professionally.
      
      Context Data (JSON):
      ${contextData}
      
      User Question:
      ${prompt}`,
    });
    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate insight. Please try again.";
  }
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!ai) return "API Key is missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, short marketing description (max 2 sentences) for a product named "${productName}" in the category "${category}".`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate description.";
  }
};