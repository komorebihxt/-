import { GoogleGenAI, SchemaType } from "@google/generative-ai";
import { AnalysisResult } from "../types";

// 初始化 AI
const genAI = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

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
  try {
    // 换成更稳定的 1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
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
    console.error("分析失败，启动保底方案:", error);
    // 返回一个默认值，防止页面显示“分析失败”
    return {
      fluidity: 50, firmness: 50, gloss: 50, dullness: 50, score: 60,
      humorCopy: "哎呀，肠道信号太强，AI 暂时断线了！这是为你预设的潮玩形态。",
      imagePrompt: "A professional 3D art toy, glossy brown texture, studio lighting",
      charms: ["神秘感", "待解析"],
      environment: "艺术实验室"
    };
  }
}

export async function generateArtToyImage(result: AnalysisResult): Promise<string> {
  try {
    const isLiquid = result.fluidity > 70 || result.firmness < 30;
    const shapePrompt = isLiquid 
      ? "THE SHAPE MUST BE A MELTED, PUDDLE-LIKE, SEMI-LIQUID SPLATTER. TOPPED WITH GLOSSY RED CHILI OIL DROPLETS." 
      : "THE SHAPE MUST BE A SCULPTED RADIANT SPIRAL OR COILED POOP-SHAPE.";

    const finalPrompt = `Professional high-end Art Toy studio photography, 3D render, Octane render. Subject: ${result.imagePrompt}. ${shapePrompt} MAIN MATERIAL IS GLOSSY BROWN. BRIGHT CLEAN PASTEL BACKGROUND.`;

    // 重点：如果 gemini-1.5-flash-image 额度不够，请确保你在 Google AI Studio 开启了 Image Generation 功能
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent(finalPrompt);
    
    // 检查是否有图像数据返回
    const candidates = response.response.candidates;
    if (candidates && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data in response");
  } catch (error) {
    console.error("生成图片失败:", error);
    // 如果图片生成失败，可以返回一个占位图链接，防止转圈
    return "https://via.placeholder.com/512/f5f2ed/2d1b14?text=Art+Toy+Rendering...";
  }
}
