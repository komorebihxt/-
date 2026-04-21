import { GoogleGenAI, SchemaType } from "@google/generative-ai";
import { AnalysisResult } from "../types";

// 修复 1: 使用 Vite 专用的环境变量读取方式
const genAI = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are the "便便主理人" (Poo Manager) Analyst. Your job is to transform a user's dietary and lifestyle diary into 3D Art Toy parameters.
Strictly analyze the text and extract 4 dimensions (0-100).
Output Requirements:
- ALL text values MUST be in Chinese (Simplified).
- imagePrompt: A detailed English prompt describing the 3D toy. 
- Output must be in JSON format.
`;

export async function analyzeInput(text: string): Promise<AnalysisResult> {
  try {
    // 修复 2: 使用官方支持的模型名称 gemini-1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Analysis failed:", error);
    // 返回保底数据，防止页面白屏
    return {
      fluidity: 50, firmness: 50, gloss: 50, dullness: 50, score: 60,
      humorCopy: "分析遇到了点小麻烦，但艺术工坊依然为你敞开。",
      imagePrompt: "A professional 3D art toy, glossy brown, studio lighting",
      charms: ["神秘感"], environment: "Art Lab"
    } as AnalysisResult;
  }
}

export async function generateArtToyImage(result: AnalysisResult): Promise<string> {
  try {
    const isLiquid = result.fluidity > 70 || result.firmness < 30;
    const shapePrompt = isLiquid 
      ? "THE SHAPE MUST BE A MELTED, PUDDLE-LIKE, SEMI-LIQUID SPLATTER. TOPPED WITH GLOSSY RED CHILI OIL DROPLETS." 
      : "THE SHAPE MUST BE A SCULPTED RADIANT SPIRAL OR COILED POOP-SHAPE.";

    const finalPrompt = `Professional high-end Art Toy studio photography, 3D render. Subject: ${result.imagePrompt}. ${shapePrompt} MAIN MATERIAL IS GLOSSY BROWN. BRIGHT CLEAN PASTEL BACKGROUND.`;

    // 修复 3: 生成图片目前在 Free Tier 建议使用常规模型生成描述，或确保你有 Image Generation 权限
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(finalPrompt);
    
    const candidates = response.response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return ""; 
  } catch (error) {
    console.error("Image generation failed:", error);
    return "";
  }
}
