import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessInsight = async (prompt: string, contextData: string): Promise<string> => {
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
    return response.text || "Aucune réponse générée.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la génération de l'analyse.";
  }
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, short marketing description (max 2 sentences) in French for a product named "${productName}" in the category "${category}".`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Impossible de générer la description.";
  }
};