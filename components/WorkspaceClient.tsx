"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatPanel } from "./ChatPanel";
import { CodePanel } from "./CodePanel";
import { MobileBlocker } from "./MobileBlocker";
import { MIN_CREDITS_TO_GENERATE, GEMINI_MODELS } from "@/lib/constants";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type {
  Message,
  FileData,
  StatusStep,
  WorkspaceData,
} from "@/types/workspace";

export type {
  MessageRole,
  Message,
  FileData,
  StatusStep,
} from "@/types/workspace";

interface WorkspaceClientProps {
  initialPrompt: string | null;
  workspace: WorkspaceData | null;
  userCredits: number;
  userId: string;
  userPlan: string;
}

function parseMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is Message =>
      typeof m === "object" && m !== null && "role" in m && "content" in m
  );
}

function parseFileData(raw: unknown): FileData | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (!f.files || !f.dependencies) return null;
  return raw as FileData;
}

export function WorkspaceClient({
  initialPrompt,
  workspace,
  userCredits,
  userId,
  userPlan,
}: WorkspaceClientProps) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    workspace?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>(
    parseMessages(workspace?.messages)
  );
  const [fileData, setFileData] = useState<FileData | null>(
    parseFileData(workspace?.fileData)
  );
  const [credits, setCredits] = useState(userCredits);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    userPlan !== "free" && GEMINI_MODELS.some(m => m.id === "gemini-3.5-pro")
      ? "gemini-3.5-pro"
      : "gemini-3.5-flash"
  );

  const generateAbortRef = useRef<AbortController | null>(null);
  const improveAbortRef = useRef<AbortController | null>(null);

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const workspaceIdRef = useRef<string | null>(workspaceId);
  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const fileDataRef = useRef<FileData | null>(fileData);
  useEffect(() => {
    fileDataRef.current = fileData;
  }, [fileData]);

  const pushStep = (label: string) => {
    setStatusLog((prev) => [
      ...prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s
      ),
      { label, status: "running" as const },
    ]);
  };

  const completeSteps = () => {
    setStatusLog((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s
      )
    );
  };

  const handleGenerate = useCallback(
    async (prompt: string, imageUrl?: string) => {
      if (isGenerating) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;

      const userMessage: Message = {
        role: "user",
        content: prompt,
        ...(imageUrl ? { imageUrl } : {}),
      };

      const currentMessages = messagesRef.current;
      const currentWorkspaceId = workspaceIdRef.current;

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setStatusLog([{ label: "Thinking…", status: "running" }]);

      const abortController = new AbortController();
      generateAbortRef.current = abortController;

      try {
        const conversationHistory = [...currentMessages, userMessage];

        const res = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            workspaceId: currentWorkspaceId,
            userId,
            messages: conversationHistory,
            fileData: fileDataRef.current,
            modelId: selectedModel,
          }),
        });

        if (res.status === 402) {
          toast.error("Not enough credits for this model. Please upgrade or switch models.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (res.status === 429) {
          toast.error("Too many requests. Please slow down.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Generation failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "status") {
              pushStep(event.message);
            } else if (event.type === "done") {
              completeSteps();
              setWorkspaceId(event.workspaceId);
              setFileData(event.fileData);
              setCredits(event.creditsRemaining);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: event.assistantMessage },
              ]);
              window.history.replaceState(
                null,
                "",
                `/workspace?id=${event.workspaceId}`
              );
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Something went wrong."
        );
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        generateAbortRef.current = null;
        setIsGenerating(false);
        setStatusLog([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [credits, isGenerating, userId, selectedModel]
  );

  const handleImprove = useCallback(
    async (userRequest: string) => {
      if (isGenerating || isImproving) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;
      if (!workspaceIdRef.current) return;

      const currentFileData = fileDataRef.current;
      if (!currentFileData) return;

      setIsImproving(true);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userRequest },
        { role: "assistant", content: "" }, 
      ]);

      const abortController = new AbortController();
      improveAbortRef.current = abortController;

      try {
        const res = await fetch("/api/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            userId,
            workspaceId: workspaceIdRef.current,
            userRequest,
            fileData: currentFileData,
            modelId: selectedModel,
          }),
        });

        if (res.status === 403) {
          toast.error(
            "Upgrade to Starter or Pro to use Improve with Shipit Agent."
          );
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (res.status === 402) {
          toast.error("Not enough credits.");
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Improve failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedThinking = "";

        const localPatches: Record<string, { code: string }> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "thinking") {
              accumulatedThinking += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: accumulatedThinking,
                };
                return updated;
              });
            } else if (event.type === "file_patch") {
              localPatches[event.path] = { code: event.code };
            } else if (event.type === "done") {
              setFileData(event.fileData);
              setCredits(event.creditsRemaining);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: event.summary,
                };
                return updated;
              });
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        toast.error(err instanceof Error ? err.message : "Improve failed.");
        setMessages((prev) => prev.slice(0, -2));
      } finally {
        improveAbortRef.current = null;
        setIsImproving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [credits, isGenerating, isImproving, userId, selectedModel]
  );

  const handleStop = useCallback(() => {
    generateAbortRef.current?.abort();
    improveAbortRef.current?.abort();
  }, []);

  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, []);

  return (
    <>
      <div className="md:hidden">
        <MobileBlocker />
      </div>

      <div className="relative hidden md:flex h-screen w-full bg-[var(--min-bg-subtle)] overflow-hidden">
        {/* Continuous Ambient Minimalist Animation */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[var(--min-border)] opacity-30 blur-[120px] animate-[abstract-float_20s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--min-border)] opacity-30 blur-[100px] animate-[abstract-float_25s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[var(--min-border)] opacity-20 animate-[pulse-ring_15s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 flex h-full w-full p-6 pt-24 gap-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex flex-col w-[360px] h-full shrink-0 min-surface min-shadow overflow-hidden bg-[var(--min-surface)]/80 backdrop-blur-xl"
          >
            <ChatPanel
              isImproving={isImproving}
              messages={messages}
              isGenerating={isGenerating}
              statusLog={statusLog}
              credits={credits}
              initialPrompt={initialPrompt}
              onGenerate={handleGenerate}
              onStop={handleStop}
              userId={userId}
              workspaceId={workspaceId}
              appTitle={fileData?.title ?? workspace?.title ?? null}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              userPlan={userPlan}
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
            className="flex flex-1 h-full min-surface min-shadow overflow-hidden bg-[var(--min-surface)]/80 backdrop-blur-xl"
          >
            <CodePanel
              fileData={fileData}
              isGenerating={isGenerating}
              statusLog={statusLog}
              onImprove={handleImprove}
              onFixError={(error) =>
                handleGenerate(
                  `There is an error in the preview:\n\n\`\`\`\n${error}\n\`\`\`\n\nPlease fix it.`
                )
              }
              onFilePatch={handleFilePatch}
              appTitle={fileData?.title ?? workspace?.title ?? null}
              isImproving={isImproving}
              isProUser={userPlan === "pro"}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
