import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { db } from "@/lib/prisma";
import { CREDIT_COST_PER_GENERATION, MODEL_CREDIT_COSTS } from "@/lib/constants";
import type { Message, FileData } from "@/types/workspace";
import { aj } from "@/lib/arcjet";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// OpenAI client initialized dynamically in the route handler based on model


// ─── SSE helper ───────────────────────────────────────────────────────────────

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({ type, ...(payload as object) })}\n\n`;
}

// ─── Extract short label from a Gemini thought chunk ─────────────────────────
// Gemini thoughts often start with a bold heading like **Verify Config**
// We extract that. If no bold heading, take the first sentence only.

function extractThoughtLabel(text: string): string | null {
  // Try to grab **bold heading** at the start
  const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);
  if (boldMatch) return boldMatch[1].trim();

  // Fall back to first sentence (up to first . or \n), capped at 60 chars
  const sentence = text.split(/[.\n]/)[0].trim();
  if (sentence.length >= 8 && sentence.length <= 80) return sentence;

  return null;
}

// ─── npm validation ───────────────────────────────────────────────────────────

async function validateDependencies(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const valid: Record<string, string> = {};
  await Promise.all(
    Object.entries(deps).map(async ([pkg, version]) => {
      try {
        const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) valid[pkg] = version;
      } catch {
        // silently skip hallucinated packages
      }
    })
  );
  return valid;
}

// ─── History trimming ─────────────────────────────────────────────────────────

function trimHistory(messages: Message[]): Message[] {
  if (messages.length <= 10) return messages;
  return [messages[0], ...messages.slice(-8)];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert React developer. Your job is to generate complete, working React applications based on user prompts.

RULES:
1. Always respond with a valid JSON object — no markdown fences, no extra text.
2. The JSON must match this exact shape:
{
  "assistantMessage": "<brief explanation of what you built/changed>",
  "title": "<short 2-4 word title for the app, e.g. 'Todo List App'>",
  "files": {
    "/App.js": { "code": "<full file content>" },
    "/components/SomeComponent.js": { "code": "<full file content>" }
  },
  "dependencies": {
    "some-package": "latest"
  }
}
3. Use React (functional components + hooks). Do NOT use TypeScript in generated files.
4. Use Tailwind CSS for all styling. Do not use CSS modules or inline styles unless absolutely necessary.
5. The entry point must always be /App.js and must export a default component.
6. All imports must reference files you include in "files" or packages in "dependencies".
7. Do not include react, react-dom, or tailwindcss in "dependencies" — they are always available.
8. When modifying existing code, include ALL files (both changed and unchanged) in "files".
9. Keep code clean, readable, and production-quality.
10. If the user attaches an image, use it as a design reference and match the layout/style as closely as possible.
11. Use a highly vibrant, premium, and modern UI design for all components. Utilize beautiful gradients, elegant typography, modern glassmorphism, glowing card accents, and dynamic color palettes (e.g. clean light modes, colorful accents, Indigo/Violet/Emerald/Rose gradients). Do NOT use dark theme backgrounds. The output should look like a premium, state-of-the-art production product, not a simple MVP.`;

// ─── Gemini contents builder ──────────────────────────────────────────────────

async function buildContents(messages: Message[], fileData: FileData | null) {
  const trimmed = trimHistory(messages);

  return await Promise.all(
    trimmed.map(async (msg, idx) => {
      const role = msg.role === "assistant" ? "model" : "user";

      if (msg.role === "user") {
        const parts: object[] = [];
        let text = msg.content;

        if (msg.imageUrl) {
          text = `[The user has attached an image as a design reference. Analyze it visually and generate code that matches this layout and design as closely as possible.]\n\n${text}`;
          try {
            const imgRes = await fetch(msg.imageUrl);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString("base64");
              const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
              parts.push({
                inlineData: {
                  data: base64,
                  mimeType,
                },
              });
            }
          } catch (e) {
            console.error("Failed to fetch image for Gemini:", e);
          }
        }

        const isLast = idx === trimmed.length - 1;
        if (isLast && fileData) {
          text +=
            "\n\nCurrent project files for context:\n" +
            JSON.stringify(fileData, null, 2);
        }

        parts.push({ text });
        return { role, parts };
      }

      return { role, parts: [{ text: msg.content }] };
    })
  );
}

// ─── OpenAI Messages Builder (For DeepSeek) ───────────────────────────────────

async function buildOpenAIMessages(messages: Message[], fileData: FileData | null) {
  const trimmed = trimHistory(messages);

  const openaiMessages: any[] = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  for (let idx = 0; idx < trimmed.length; idx++) {
    const msg = trimmed[idx];
    const isLast = idx === trimmed.length - 1;
    let text = msg.content;
    
    // DeepSeek V4 Flash mostly accepts text. If there is an image, we can just pass the text and note the image is present.
    // Multimodal support may vary on NVIDIA APIs, but we will pass standard text content.
    if (msg.imageUrl) {
      text = `[The user attached an image as a design reference. Analyze it if you can, and generate code that matches this layout/design.]\n\n${text}`;
    }

    if (isLast && fileData) {
      text += "\n\nCurrent project files for context:\n" + JSON.stringify(fileData, null, 2);
    }
    
    openaiMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: text
    });
  }

  return openaiMessages;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId, userId, messages, fileData, modelId = "gemini-3.5-pro" } = body as {
    workspaceId: string | null;
    userId: string;
    messages: Message[];
    fileData: FileData | null;
    modelId?: string;
  };

  if (!messages?.length) {
    return Response.json({ message: "No messages provided" }, { status: 400 });
  }

  // ── Arcjet: rate limit, prompt injection, sensitive info ──────────────────
  // detectPromptInjectionMessage requires the actual user text to inspect.

  // const arcjetReq = new Request(request.url, {
  //   method: request.method,
  //   headers: request.headers,
  //   body: JSON.stringify(body),
  // });

  // const lastUserMessage =
  //   [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  // const decision = await aj.protect(arcjetReq, {
  //   requested: 1,
  //   userId: clerkId,
  //   detectPromptInjectionMessage: lastUserMessage,
  // });

  // if (decision.isDenied()) {
  //   return Response.json(
  //     { message: decision.reason?.type ?? "Request blocked" },
  //     { status: 429 }
  //   );
  // }

  const user = await db.user.findUnique({
    where: { id: userId, clerkId },
    select: { id: true, credits: true, plan: true },
  });

  if (!user)
    return Response.json({ message: "User not found" }, { status: 404 });

  if (modelId === "gemini-3.5-pro" && user.plan === "free") {
    return Response.json({ message: "Upgrade required to use Gemini 3.5 Pro" }, { status: 403 });
  }

  const requiredCredits = MODEL_CREDIT_COSTS[modelId] || CREDIT_COST_PER_GENERATION;

  if (user.credits < requiredCredits) {
    return Response.json({ message: "Insufficient credits" }, { status: 402 });
  }

  const finalModelId =
    modelId === "gemini-3.5-pro" && process.env.NEXT_PUBLIC_ENABLE_GEMINI_3_5_PRO !== "true"
      ? "gemini-3.1-pro-preview"
      : modelId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk));

      try {
        let accumulated = ""; // final JSON output
        let lastEmitTime = 0; // throttle thought emissions

        if (!finalModelId.startsWith("gemini-")) {
          let apiKey = "";
          if (finalModelId === "deepseek-v4-flash") apiKey = process.env.NVIDIA_API_KEY_DEEPSEEK_FLASH || "";
          else if (finalModelId === "deepseek-v4-pro") apiKey = process.env.NVIDIA_API_KEY_DEEPSEEK_PRO || "";
          else if (finalModelId === "gpt-oss-120b") apiKey = process.env.NVIDIA_API_KEY_GPT_OSS || "";

          const openai = new OpenAI({
            baseURL: "https://integrate.api.nvidia.com/v1",
            apiKey,
          });

          const openaiMessages = await buildOpenAIMessages(messages, fileData);
          const isDeepseek = finalModelId.startsWith("deepseek-");
          const isFlash = finalModelId === "deepseek-v4-flash";
          const modelString = isDeepseek ? `deepseek-ai/${finalModelId}` : `openai/${finalModelId}`;

          const requestBody: any = {
            model: modelString,
            messages: openaiMessages,
            temperature: 0.7,
            top_p: 0.95,
            max_tokens: finalModelId === "gpt-oss-120b" ? 4096 : 16384,
            stream: true,
          };

          if (isDeepseek) {
            requestBody.chat_template_kwargs = { thinking: isFlash, reasoning_effort: "high" };
          }

          const completion = await openai.chat.completions.create(requestBody);

          for await (const chunk of completion as any) {
            const reasoning = (chunk.choices[0]?.delta as any)?.reasoning_content;
            if (reasoning) {
              const now = Date.now();
              if (now - lastEmitTime > 600) {
                const label = extractThoughtLabel(reasoning);
                if (label) {
                  enqueue(sseEvent("status", { message: label }));
                  lastEmitTime = now;
                }
              }
            }
            
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              accumulated += content;
            }
          }
        } else {
          // GEMINI PATH
          const contents = await buildContents(messages, fileData);
  
          const geminiStream = await ai.models.generateContentStream({
            model: finalModelId,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.7,
              responseMimeType: "application/json",
              thinkingConfig: {
                includeThoughts: true,
              },
            },
          });
  
          for await (const chunk of geminiStream) {
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];
  
            for (const part of parts) {
              if (!part.text) continue;
  
              if (part.thought) {
                // Extract just the short label
                const now = Date.now();
                if (now - lastEmitTime > 600) {
                  const label = extractThoughtLabel(part.text);
                  if (label) {
                    enqueue(sseEvent("status", { message: label }));
                    lastEmitTime = now;
                  }
                }
              } else {
                // Actual JSON output
                accumulated += part.text;
              }
            }
          }
        }

        // ── Parse the complete JSON response ──────────────────────────────────

        let parsed: {
          assistantMessage: string;
          title?: string;
          files: Record<string, { code: string }>;
          dependencies: Record<string, string>;
        };

        let finalJSON = accumulated.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = finalJSON.indexOf("{");
        const lastBrace = finalJSON.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          finalJSON = finalJSON.substring(firstBrace, lastBrace + 1);
        }

        try {
          parsed = JSON.parse(finalJSON);
        } catch (parseError) {
          console.error("[gen-ai-code] JSON Parse Error. accumulated length:", accumulated.length, "accumulated snippet:", accumulated.substring(0, 200));
          console.error("[gen-ai-code] finalJSON snippet:", (finalJSON || "").substring(0, 200));
          
          enqueue(
            sseEvent("error", {
              message: "AI returned invalid JSON. Please try again.",
            })
          );
          controller.close();
          return;
        }

        const {
          assistantMessage,
          title: aiTitle,
          files,
          dependencies,
        } = parsed;

        if (!files || typeof files !== "object") {
          enqueue(
            sseEvent("error", {
              message: "AI response missing files. Please try again.",
            })
          );
          controller.close();
          return;
        }

        // ── Validate npm packages ──────────────────────────────────────────────

        enqueue(sseEvent("status", { message: "Validating packages…" }));
        const validatedDeps = await validateDependencies(dependencies ?? {});
        const newFileData: FileData = {
          files,
          dependencies: validatedDeps,
          title: aiTitle,
        };

        // ── Upsert workspace + deduct credit (single transaction) ──────────────

        enqueue(sseEvent("status", { message: "Saving…" }));

        const lastUserMessage = messages[messages.length - 1];
        const updatedMessages: Message[] = [
          ...messages,
          { role: "assistant", content: assistantMessage },
        ];

        const [workspace] = await db.$transaction([
          workspaceId
            ? db.workspace.update({
                where: { id: workspaceId, userId },
                data: {
                  messages: updatedMessages as never,
                  fileData: newFileData as never,
                },
              })
            : db.workspace.create({
                data: {
                  userId,
                  title: aiTitle ?? lastUserMessage.content.slice(0, 80),
                  messages: updatedMessages as never,
                  fileData: newFileData as never,
                },
              }),
          // ── Deduct credits ────────────────────────────────────────────────────────
          db.user.update({
            where: { id: userId },
            data: { credits: { decrement: requiredCredits } },
          }),
        ]);

        const updatedUser = await db.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        // ── Emit final result ──────────────────────────────────────────────────

        enqueue(
          sseEvent("done", {
            workspaceId: workspace.id,
            assistantMessage,
            fileData: newFileData,
            creditsRemaining:
              updatedUser?.credits ?? user.credits - requiredCredits,
          })
        );
      } catch (err) {
        console.error("[gen-ai-code] stream error:", err);
        let errMsg = "Something went wrong. Please try again.";
        
        if (err instanceof Error) {
          errMsg = err.message;
          // Clean up ugly JSON errors from Google SDK
          if (errMsg.includes("429") || errMsg.includes("exceeded your current quota")) {
            errMsg = "We are experiencing unusually high traffic right now. Please try again in a few moments.";
          } else if (errMsg.includes("404") || errMsg.includes("not found")) {
            errMsg = "This AI model is temporarily unavailable. Please try again later.";
          } else if (errMsg.includes("{")) {
            try {
              // Try to parse raw JSON errors to find a clean message
              const parsed = JSON.parse(errMsg);
              if (parsed?.error?.message) {
                const innerParsed = JSON.parse(parsed.error.message);
                if (innerParsed?.error?.message) {
                  errMsg = innerParsed.error.message;
                } else {
                  errMsg = parsed.error.message;
                }
              }
            } catch {
              // ignore parse errors and stick with string
            }
          }
        }
        
        enqueue(
          sseEvent("error", {
            message: errMsg,
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "nodejs";
export const maxDuration = 300; // for vercel - 300s on Fluid
