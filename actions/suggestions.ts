"use server";

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type Suggestion = {
  label: string;
  prompt: string;
};

export type SuggestionsResponse = {
  isFallback: boolean;
  suggestions: Suggestion[];
};

const SYSTEM_PROMPT = `Generate exactly 6 unique, creative, and highly trending web application ideas based on daily hot trends in tech and fast-growing domains (e.g., AI agents, Web3, spatial computing, clean energy dashboards, automated productivity).
The ideas MUST be tech-friendly, developer-oriented, or highly functional utility tools. 
Do NOT generate common, simple, or non-technical ideas like "Coffee Shop Landing Page", "Personal Portfolio", or "Restaurant Menu".
To make the output diverse on every request, randomize the categories. Return them as a JSON list of objects with two fields: "label" (a readable, short natural phrase, 3-5 words, e.g., "AI agent workflow builder", "Web3 gas fee tracker", "Spatial UI playground") and "prompt" (a highly detailed, rich, and descriptive prompt of what to build, specifying key sections, interactive features, design aesthetics, and user flows).
Do not include any markdown format like \`\`\`json. Return only the raw JSON.`;

export async function getTrendingSuggestions(): Promise<SuggestionsResponse> {
  const models = [
    { id: "gemini-3.5-flash", type: "google" },
    { id: "deepseek-v4-flash", type: "nvidia" },
    { id: "gpt-oss-120b", type: "nvidia" },
  ];
  
  // Randomly select a model to distribute load and utilize all models
  const selectedModel = models[Math.floor(Math.random() * models.length)];

  try {
    let text = "";

    if (selectedModel.type === "google") {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: selectedModel.id,
        contents: SYSTEM_PROMPT,
      });
      text = response.text?.trim() || "";
    } else {
      let apiKey = "";
      if (selectedModel.id === "deepseek-v4-flash") apiKey = process.env.NVIDIA_API_KEY_DEEPSEEK_FLASH || "";
      else if (selectedModel.id === "gpt-oss-120b") apiKey = process.env.NVIDIA_API_KEY_GPT_OSS || "";
      
      const openai = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey,
      });

      const isDeepseek = selectedModel.id.startsWith("deepseek-");
      const modelString = isDeepseek ? `deepseek-ai/${selectedModel.id}` : `openai/${selectedModel.id}`;

      const requestBody: any = {
        model: modelString,
        messages: [{ role: "user", content: SYSTEM_PROMPT }],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4096,
      };

      if (isDeepseek) {
        requestBody.chat_template_kwargs = { thinking: false };
      }

      const completion = await openai.chat.completions.create(requestBody);
      text = completion.choices[0]?.message?.content || "";
    }

    // Clean up markdown block wraps if returned by the model
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const suggestions = JSON.parse(cleanText);
    if (Array.isArray(suggestions) && suggestions.length === 6 && suggestions[0].label && suggestions[0].prompt) {
      return { isFallback: false, suggestions };
    }
  } catch (error) {
    console.error(`Failed to generate trending suggestions from ${selectedModel.id}:`, error);
  }
  
  return { isFallback: false, suggestions: [] };
}
