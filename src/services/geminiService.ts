import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are the "便便主理人" (Poo Manager) Analyst. Your job is to transform a user's dietary and lifestyle diary into 3D Art Toy parameters.
Strictly analyze the text and extract 4 dimensions (0-100). The physiological mapping must be reactive and extreme:
1. 流动性: Heavily increased by spicy food, heavy oil/salt, cold drinks, alcohol, raw/cold food.
2. 坚固度: Increased by high fiber, coarse grains, dehydration. Heavily DECREASED by diarrhea triggers.
3. 光泽度: Increased by healthy fats, yogurt, probiotics. High oil can also lead to greasy shine.
4. 暗沉值: Increased by staying up late, high protein (meat), high stress, pollution.

Output Requirements:
- ALL text values MUST be in Chinese (Simplifed). NO English.
- imagePrompt: A detailed English prompt describing the 3D toy. 
  IMPORTANT: The base color MUST be shades of brown (Chocolate, Caramel, Cocoa, Sienna). 
  IMPORTANT: If the user ate SPICY or OILY food, include "glossy red oil splatter" or "chili oil glossy finish" in the prompt.
  IMPORTANT: Reflect the texture based on the metrics. If fluidity is high (>70), use "melted", "liquid splatter", "soft puddle". If firmness is high (>70), use "solid", "sculpted porcelain", "dense texture".
  IMPORTANT: Use BRIGHT, SOFT, LIGHT TONES for the BACKGROUND ONLY. Pastel studio lighting.

Output must be in JSON format.
`;

export async function analyzeInput(text: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ parts: [{ text }] }],
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fluidity: { type: Type.NUMBER },
          firmness: { type: Type.NUMBER },
          gloss: { type: Type.NUMBER },
          dullness: { type: Type.NUMBER },
          score: { type: Type.NUMBER },
          humorCopy: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          charms: { type: Type.ARRAY, items: { type: Type.STRING } },
          environment: { type: Type.STRING },
        },
        required: ["fluidity", "firmness", "gloss", "dullness", "score", "humorCopy", "imagePrompt", "charms", "environment"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No analysis result received");
  }

  return JSON.parse(response.text);
}

export async function generateArtToyImage(result: AnalysisResult): Promise<string> {
  const isLiquid = result.fluidity > 70 || result.firmness < 30;
  
  const shapePrompt = isLiquid 
    ? "THE SHAPE MUST BE A MELTED, PUDDLE-LIKE, SEMI-LIQUID SPLATTER OR ORGANIC GLOSSY MOUND (SLOPPY AND SOFT TEXTURE). TOPPED WITH GLOSSY RED CHILI OIL DROPLETS AND SPATTER." 
    : "THE SHAPE MUST BE A SCULPTED RADIANT SPIRAL OR COILED POOP-SHAPE (ARTISTIC SOFT-SERVE STYLE).";

  const colorPrompt = "THE MAIN MATERIAL IS GLOSSY BROWN (CHOCOLATE OR COCOA COLOR).";

  const finalPrompt = `Professional high-end Art Toy studio photography, 3D render, Octane render, 8k resolution. The subject is: ${result.imagePrompt}. ${shapePrompt} ${colorPrompt} BRIGHT AND CLEAN PASTEL BACKGROUND, SOFT LUXURY STUDIO LIGHTING, high-gloss finish.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ parts: [{ text: finalPrompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Image generation failed");
}
