"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowUp,
  Paperclip,
  Loader2,
  X,
  Square,
  Check,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PricingModal } from "@/components/PricingModal";
import type { Message, StatusStep } from "@/types/workspace";
import { createClient } from "@supabase/supabase-js";
import { BlueTitle, GoogleSpark } from "./reusables";
import { GEMINI_MODELS, MODEL_CREDIT_COSTS, CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatPanelProps {
  messages: Message[];
  isGenerating: boolean;
  isImproving: boolean;
  statusLog: StatusStep[];
  credits: number;
  initialPrompt: string | null;
  onGenerate: (prompt: string, imageUrl?: string) => Promise<void>;
  onStop: () => void;
  userId: string;
  workspaceId: string | null;
  appTitle: string | null;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  userPlan: string;
}

export function ChatPanel({
  messages,
  isGenerating,
  isImproving,
  statusLog,
  credits,
  initialPrompt,
  onGenerate,
  onStop,
  userId,
  workspaceId,
  appTitle,
  selectedModel,
  setSelectedModel,
  userPlan,
}: ChatPanelProps) {
  const { user } = useUser();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const hasAutoSubmittedRef = useRef(false);
  const requiredCredits = MODEL_CREDIT_COSTS[selectedModel] || CREDIT_COST_PER_GENERATION;
  const noCredits = credits < requiredCredits;

  const lastMsg = messages[messages.length - 1];
  const isStreamingAssistant = isImproving && lastMsg?.role === "assistant";

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating, isImproving]);

  useEffect(() => {
    if (!initialPrompt || hasAutoSubmittedRef.current || messages.length > 0)
      return;
    hasAutoSubmittedRef.current = true;
    onGenerate(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || isImproving || noCredits) return;
    setInput("");
    setPendingImageUrl(null);
    await onGenerate(trimmed, pendingImageUrl ?? undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userPlan === "free") {
      toast.error("Image uploads are only available on the Starter or Pro plan.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${workspaceId ?? "new"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("workspace-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("workspace-images")
        .getPublicUrl(path);
      setPendingImageUrl(data.publicUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload image."
      );
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSubmit =
    input.trim().length > 0 && !isGenerating && !isImproving && !noCredits;

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--min-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <GoogleSpark className="h-3 w-3" />
          <BlueTitle className="text-[14px]">{appTitle || "New App"}</BlueTitle>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-[var(--min-text-tertiary)] hover:text-[var(--min-text-primary)] hover:bg-[var(--min-bg-subtle)] transition-all cursor-pointer">
              {GEMINI_MODELS.find(m => m.id === selectedModel)?.name || "Select Model"}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {GEMINI_MODELS.map((model) => {
                const isLocked = model.id === "gemini-3.5-pro" && userPlan === "free";
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => {
                      if (isLocked) {
                        toast.error("Gemini 3.5 Pro is locked. Please upgrade to a paid plan.");
                        return;
                      }
                      setSelectedModel(model.id);
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1 p-2 cursor-pointer",
                      isLocked && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <span className="text-[13px] font-medium leading-none flex items-center gap-1.5 w-full justify-between">
                      {model.name}
                      {isLocked && (
                        <span className="text-[9px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Locked</span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{model.description}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <PricingModal reason={noCredits ? "credits" : "upgrade"}>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer",
                noCredits
                  ? "bg-[var(--min-text-primary)] text-[var(--min-bg)]"
                  : "bg-transparent text-[var(--min-text-tertiary)] hover:text-[var(--min-text-primary)]"
              )}
            >
              {noCredits
                ? "Upgrade"
                : `${credits} credit${credits !== 1 ? "s" : ""}`}
            </span>
          </PricingModal>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 py-6 [&::-webkit-scrollbar]:hidden"
      >
        {messages.length === 0 && !isGenerating && (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--min-bg-subtle)] border border-[var(--min-border)]">
              <GoogleSpark className="h-6 w-6" />
            </div>
            <p className="text-center text-[15px] font-medium text-[var(--min-text-tertiary)] max-w-[200px] leading-relaxed">
              Describe your idea, we build the code.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const isLiveStream = isLast && isStreamingAssistant;

            return (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 mr-2 mb-1">
                      <span className="text-[11px] font-semibold text-[var(--min-text-tertiary)] uppercase tracking-wider">
                        You
                      </span>
                    </div>
                    <div className="max-w-[90%] space-y-2">
                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imageUrl}
                          alt="uploaded"
                          className="max-h-48 w-full rounded-2xl object-cover min-shadow"
                        />
                      )}
                      <div className="rounded-[24px] bg-[var(--min-bg-subtle)] border border-[var(--min-border)] px-5 py-4">
                        <p className="text-[14px] leading-relaxed font-medium text-[var(--min-text-primary)] wrap-break-word">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 ml-2 mb-1">
                      <GoogleSpark className="h-3 w-3" animate={isLiveStream} />
                      <span className="text-[11px] font-semibold text-[var(--min-text-tertiary)] uppercase tracking-wider">
                        Shipit AI
                      </span>
                    </div>
                    <div className="min-w-0 px-2 py-1">
                      {isLiveStream && !msg.content ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 shrink-0 text-[var(--min-text-tertiary)] animate-spin" />
                          <span className="text-[13px] font-medium text-[var(--min-text-tertiary)]">
                            Working...
                          </span>
                        </div>
                      ) : isLiveStream && msg.content ? (
                        <div>
                          <p className="text-[14px] leading-relaxed text-[var(--min-text-secondary)] font-medium wrap-break-word">
                            {msg.content}
                            <span className="ml-1 inline-block h-3.5 w-[2px] animate-[blink_1s_ease-in-out_infinite] bg-[var(--min-text-primary)] align-middle" />
                          </p>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none wrap-break-word text-[14px] leading-relaxed font-medium text-[var(--min-text-primary)] [&_code]:rounded-md [&_code]:bg-[var(--min-bg-subtle)] [&_code]:border [&_code]:border-[var(--min-border)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[var(--min-text-primary)] [&_code]:text-[13px] [&_code]:break-all [&_li]:my-1 [&_p]:my-2 [&_pre]:overflow-x-auto! [&_pre]:whitespace-pre-wrap! [&_ul]:my-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 ml-2 mb-1">
                <GoogleSpark className="h-3 w-3" animate />
                <span className="text-[11px] font-semibold text-[var(--min-text-tertiary)] uppercase tracking-wider">
                  Shipit AI
                </span>
              </div>
              <div className="px-2 py-1">
                <div className="space-y-3">
                  {statusLog.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {step.status === "running" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--min-text-tertiary)]" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[var(--min-text-primary)]" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[13px] font-medium transition-colors duration-300",
                          step.status === "running"
                            ? "text-[var(--min-text-primary)]"
                            : "text-[var(--min-text-tertiary)]"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {noCredits && (
        <div className="mx-5 mb-4 rounded-2xl border border-[var(--min-border)] bg-[var(--min-bg-subtle)] px-5 py-4 min-shadow">
          <p className="mb-3 text-[13px] font-semibold text-[var(--min-text-primary)]">
            Credit limit reached
          </p>
          <PricingModal reason="credits">
            <span className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--min-text-primary)] text-[13px] font-bold text-[var(--min-bg)] transition-transform active:scale-95">
              Upgrade Plan
            </span>
          </PricingModal>
        </div>
      )}

      {/* Input */}
      <div className="p-5 border-t border-[var(--min-border)]">
        {pendingImageUrl && (
          <div className="relative mb-3 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImageUrl}
              alt="pending upload"
              className="h-16 w-16 rounded-xl object-cover border border-[var(--min-border)] min-shadow"
            />
            <button
              onClick={() => setPendingImageUrl(null)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--min-surface)] border border-[var(--min-border)] text-[var(--min-text-secondary)] hover:text-[var(--min-text-primary)] min-shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "rounded-[24px] border bg-[var(--min-surface)] transition-all",
            isGenerating || isImproving
              ? "border-[var(--min-border)] opacity-80"
              : noCredits
              ? "border-[var(--min-border)] opacity-60"
              : "border-[var(--min-border)] focus-within:border-[var(--min-text-primary)] focus-within:min-shadow-hover"
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || isImproving || noCredits}
            placeholder={
              noCredits
                ? "Upgrade to build"
                : isImproving
                ? "Improving..."
                : isGenerating
                ? "Generating..."
                : "Ask AI to change..."
            }
            rows={1}
            className="w-full resize-none bg-transparent px-5 pb-2 pt-4 text-[14px] font-medium text-[var(--min-text-primary)] placeholder:text-[var(--min-text-tertiary)] focus:outline-none"
            style={{ maxHeight: 160 }}
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={isGenerating || isImproving || isUploading || noCredits}
              className="h-8 w-8 rounded-full text-[var(--min-text-tertiary)] hover:bg-[var(--min-bg-subtle)] hover:text-[var(--min-text-primary)] disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {isGenerating || isImproving ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-8 w-8 rounded-full bg-[var(--min-text-primary)] text-[var(--min-bg)] hover:scale-105 active:scale-95 transition-transform"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  canSubmit
                    ? "bg-[var(--min-text-primary)] text-[var(--min-bg)] hover:scale-105 active:scale-95"
                    : "bg-[var(--min-bg-subtle)] text-[var(--min-text-tertiary)]"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
