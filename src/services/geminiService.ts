import { GoogleGenAI } from "@google/generative-ai"; // 1. 简化导入
import { AnalysisResult } from "../types";

// 初始化 AI
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
    // 2. 使用更兼容的获取模型方式
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: ANALYSIS_SYSTEM_INSTRUCTION + "\nUser Input: " + text }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("分析失败:", error);
    // 3. 这里的返回结构必须严格对应你的 AnalysisResult 类型定义
    return {
      fluidity: 50,
      firmness: 50,
      gloss: 50,
      dullness: 50,
      score: 60,
      humorCopy: "哎呀，肠道信号太强，AI 暂时断线了！",
      imagePrompt: "A professional 3D art toy, glossy brown texture",
      charms: ["神秘感"],
      environment: "艺术实验室"
    } as AnalysisResult;
  }
}

export async function generateArtToyImage(result: AnalysisResult): Promise<string> {
  try {
    const finalPrompt = `Professional 3D render of an art toy: ${result.imagePrompt}. High gloss finish, brown cocoa color, pastel background.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(finalPrompt);
    
    const candidates = response.response.candidates;
    // 4. 增加更严谨的空值判断
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return ""; 
  } catch (error) {
    console.error("图片生成失败:", error);
    return ""; 
  }
}
