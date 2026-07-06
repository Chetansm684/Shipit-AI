/* eslint-disable */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { ArrowRight, Sparkles, Zap, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole";
import { Badge } from "@/components/ui/badge";
import { FEATURES, PLACEHOLDERS, STEPS } from "@/lib/data";
import { PRICING_PLANS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProjects } from "@/actions/projects";
import { getTrendingSuggestions, type Suggestion } from "@/actions/suggestions";
import {
  BlueTitle,
  GrayTitle,
  SectionHeading,
  SectionLabel,
} from "@/components/reusables";

export default function LandingPage() {
  const { isSignedIn, has } = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [latestProject, setLatestProject] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = () => {
      getTrendingSuggestions()
        .then((res) => {
          if (res?.suggestions && res.suggestions.length > 0) {
            setSuggestions(res.suggestions);
          }
        })
        .catch((err) => console.error("Failed to load trending suggestions:", err));
    };

    // Initial fetch
    fetchSuggestions();

    // Auto-refresh every 2 minutes (120,000 ms)
    const interval = setInterval(fetchSuggestions, 120000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      getUserProjects()
        .then((projects) => {
          if (projects && projects.length > 0) {
            setLatestProject(projects[0]);
          }
        })
        .catch((err) => console.error("Error fetching projects:", err));
    } else {
      setLatestProject(null);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isFocused || prompt) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [isFocused, prompt]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* ── HERO (Cinematic Google Labs Style) ───────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] bg-background text-foreground overflow-hidden pt-32 pb-32">
        {/* Background cinematic blur gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center opacity-60 mix-blend-multiply dark:mix-blend-screen">
          <div className="absolute w-[800px] h-[800px] bg-emerald-400/30 dark:bg-[#2E3C27]/40 rounded-full blur-[140px] animate-[blob-spin_30s_linear_infinite]" style={{ top: '10%', left: '-10%' }} />
          <div className="absolute w-[700px] h-[700px] bg-amber-400/30 dark:bg-[#3C3A27]/30 rounded-full blur-[120px] animate-[blob-spin-reverse_25s_linear_infinite]" style={{ bottom: '-10%', right: '5%' }} />
        </div>

        {/* Floating 3D Cards Collage */}
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden perspective-1000">
          <motion.div 
            initial={{ opacity: 0, y: 40, rotateZ: -10, rotateX: 10 }}
            animate={{ opacity: 0.15, y: 0, rotateZ: -15, rotateX: 20 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute left-[10%] top-[20%] w-[300px] h-[200px] rounded-[32px] bg-foreground/10 dark:bg-white/10 backdrop-blur-3xl border border-foreground/5 dark:border-white/5"
          />
          <motion.div 
            initial={{ opacity: 0, y: -40, rotateZ: 10, rotateX: -10 }}
            animate={{ opacity: 0.15, y: 0, rotateZ: 15, rotateX: -20 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="absolute right-[10%] bottom-[20%] w-[350px] h-[250px] rounded-[32px] bg-foreground/10 dark:bg-white/10 backdrop-blur-3xl border border-foreground/5 dark:border-white/5"
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
             <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-foreground/70 dark:text-white/70" />
                <span className="text-sm font-medium tracking-wide text-foreground/80">
                  Powered by Gemini, DeepSeek & GPT
                </span>
             </div>

            <h1 className="text-[4rem] sm:text-[6rem] md:text-[8rem] font-medium leading-[0.95] tracking-[-0.04em] text-foreground">
              Shipit AI
            </h1>
            <p className="mt-6 text-[20px] sm:text-[26px] font-normal leading-snug tracking-tight text-foreground/80 max-w-3xl mx-auto">
              From Idea to App, Instantly.
            </p>
          </motion.div>

          {/* Input Pill & Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-2xl mt-12 relative"
          >
            <div className={cn(
              "relative flex items-center w-full backdrop-blur-2xl border transition-all duration-300 rounded-[40px] overflow-hidden bg-foreground/5 dark:bg-white/10",
              isFocused ? "border-foreground/20 dark:border-white/40 shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]" : "border-foreground/10 dark:border-white/15"
            )}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={1}
                className="w-full resize-none bg-transparent py-5 pl-8 pr-32 text-xl font-medium text-foreground placeholder:text-transparent focus:outline-none"
                style={{ minHeight: 72, maxHeight: 200 }}
              />
              
              <AnimatePresence>
                {!prompt && (
                  <motion.div
                    key={placeholderIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-8 right-36 pointer-events-none text-xl font-medium text-foreground/50 truncate"
                  >
                    {PLACEHOLDERS[placeholderIndex]}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSignedIn ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim()}
                    className={cn(
                      "flex items-center justify-center h-12 rounded-full px-6 text-base font-semibold transition-all",
                      prompt.trim()
                        ? "bg-foreground text-background hover:scale-105 active:scale-95 shadow-lg"
                        : "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                    )}
                  >
                    Generate
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="flex items-center justify-center h-12 rounded-full px-6 text-base font-semibold bg-foreground text-background hover:scale-105 active:scale-95 shadow-lg transition-all">
                      Try it now
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.prompt)}
                  className="rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-md px-4 py-2 text-sm font-medium text-foreground/70 hover:border-foreground/20 hover:bg-foreground/10 hover:text-foreground transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-foreground/50 dark:bg-white/50" />
          <div className="w-8 h-2 rounded-full bg-foreground dark:bg-white" />
          <div className="w-2 h-2 rounded-full bg-foreground/50 dark:bg-white/50" />
        </motion.div>
      </section>

      {/* ── BROWSER MOCKUP ────────────────────────────────────────────────── */}
      <section className="relative px-4 pb-32 bg-background overflow-hidden z-10 -mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-border bg-[#0A0A0A] shadow-[0_30px_100px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#111111] px-6 py-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
            </div>
            <div className="mx-auto flex h-8 w-64 items-center justify-center rounded-md bg-white/5 px-3">
              <span className="text-sm font-medium tracking-wide text-white/40">shipit.ai/workspace</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row h-auto md:h-[480px]">
            {/* Chat panel */}
            <div className="flex w-full md:w-80 flex-col border-b md:border-b-0 md:border-r border-white/10 bg-[#0F0F0F] min-h-[220px] md:min-h-0">
              <div className="border-b border-white/10 px-6 py-4">
                <p className="text-sm font-semibold tracking-wider text-white/40">Chat</p>
              </div>
              <div className="flex-1 space-y-6 px-6 py-6 overflow-y-auto max-h-[250px] md:max-h-none">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 border border-white/5 px-4 py-3">
                    <p className="text-sm text-white/90">
                      {latestProject ? (latestProject.firstPrompt || "Resume design") : "Generate a sleek dark mode pricing page"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Zap className="h-4 w-4 fill-black text-black" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3">
                    <p className="text-sm text-white/70 leading-relaxed">
                      {latestProject ? (
                        <>
                          I found your active workspace: <strong className="text-white">{latestProject.title || "Untitled Project"}</strong>. You have exchanged {latestProject.messageCount} prompts. Click resume to open.
                        </>
                      ) : (
                        <>
                          I&apos;ll create a responsive pricing section with 3 tiers. I&apos;ll highlight the Pro tier and add{" "}
                          <code className="text-white bg-white/10 px-1 rounded">framer-motion</code>{" "}
                          for hover effects…
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 px-4 py-4">
                {latestProject ? (
                  <button 
                    onClick={() => router.push(`/workspace?id=${latestProject.id}`)}
                    className="w-full flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 px-4 py-3 text-sm text-white font-medium transition-all"
                  >
                    <span>Open in Workspace</span>
                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3">
                    <span className="flex-1 text-sm text-white/30">Ask AI to modify…</span>
                    <ArrowRight className="h-4 w-4 text-white/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Preview/Editor area */}
            <div className="flex flex-1 flex-col bg-[#050505] min-h-[300px] md:min-h-0">
              <div className="flex items-center gap-2 border-b border-white/10 px-6 bg-[#0F0F0F]">
                <button className="border-b-2 border-white px-4 py-4 text-sm font-medium text-white">Preview</button>
                <button className="px-4 py-4 text-sm font-medium text-white/40 hover:text-white/70 transition-colors">Code</button>
              </div>
              <div className="flex flex-1 items-center justify-center p-8 text-center text-white">
                {latestProject ? (
                  <div className="flex flex-col items-center gap-5 max-w-sm">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4ADE80]">
                      <Zap className="h-8 w-8 fill-current" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight text-white mb-2">
                        {latestProject.title || "Untitled Workspace"}
                      </p>
                      <p className="text-sm font-medium text-white/50 leading-relaxed mb-6">
                        Last edited {new Date(latestProject.updatedAt).toLocaleDateString()}
                      </p>
                      <button 
                        onClick={() => router.push(`/workspace?id=${latestProject.id}`)}
                        className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 mx-auto"
                      >
                        Resume Project <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 gap-4 overflow-hidden w-full text-left">
                    {["Basic", "Pro", "Enterprise"].map((tier, ci) => (
                      <div key={tier} className={cn(
                        "flex w-1/3 flex-col gap-4 rounded-[20px] border p-5",
                        ci === 1 ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-bold uppercase tracking-wider", ci === 1 ? "text-white" : "text-white/50")}>{tier}</span>
                          {ci === 1 && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">POPULAR</span>}
                        </div>
                        <div className="text-3xl font-bold text-white">${[15, 29, 99][ci]}</div>
                        <div className="mt-2 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                              <div className="h-1.5 rounded-full bg-white/20" style={{ width: `${80 - i * 15}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className={cn(
                          "mt-auto h-8 w-full rounded-full",
                          ci === 1 ? "bg-white" : "bg-white/10"
                        )} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── EDITORIAL SECTION (Beige Google Labs Style) ───────────────── */}
      <section className="relative mesh-bg text-black dark:text-white overflow-hidden pt-32 pb-16 px-6 sm:px-12 md:px-24 rounded-t-[40px] md:rounded-t-[80px]">
        {/* Soft static ambient background blur */}
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-[#FFCCFA]/40 dark:bg-[#602058]/20 blur-[130px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-16 mb-24">
          <div className="text-center md:text-left">
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-black/50 dark:text-white/50 mb-6 block">
              About Shipit AI
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-[1.2] tracking-tight text-black dark:text-white max-w-4xl">
              Bring your concepts to life instantly. Describe your vision, and watch as we generate clean React code, handle package dependencies, and deliver a live, functional preview. <span className="text-[#0E522B] dark:text-[#4ADE80]">Get early access, share your feedback, and help turn these technologies into the products you use every day.</span>
            </h2>
          </div>
        </div>

        {/* ── FEATURES (Editorial Style) ─────────────────────────────────── */}
        <div id="features" className="relative z-10 max-w-7xl mx-auto pt-24 border-t border-black/10 dark:border-white/10">
          <div className="mb-16">
            <h3 className="text-[2.5rem] md:text-[3.5rem] font-medium tracking-tight text-black dark:text-white">
              Everything you need. <span className="text-black/40 dark:text-white/40">From prompt to production.</span>
            </h3>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 hide-scrollbar pr-12">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div 
                key={label}
                className="flex-shrink-0 w-[300px] md:w-[350px] snap-center flex flex-col group p-6 rounded-[24px] bg-white/90 dark:bg-[#111]/90 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-[#0E522B] dark:text-[#4ADE80] group-hover:bg-[#0E522B] dark:group-hover:bg-[#4ADE80] group-hover:text-[#F8F6F0] dark:group-hover:text-black transition-colors duration-300">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="mb-4 text-2xl font-medium tracking-tight text-black dark:text-white">{label}</p>
                <p className="text-lg leading-relaxed text-black/70 dark:text-white/70 font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEPS (How it works) ────────────────────────────────────────── */}
        <div className="relative z-10 max-w-7xl mx-auto pt-32 mt-32 border-t border-black/10 dark:border-white/10">
          <div className="mb-16">
            <h3 className="text-[2.5rem] md:text-[3.5rem] font-medium tracking-tight text-black dark:text-white">
              How it works. <span className="text-black/40 dark:text-white/40">Four steps to a working app.</span>
            </h3>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 hide-scrollbar pr-12">
            {STEPS.map((step, i) => (
              <div 
                key={step.number}
                className="flex-shrink-0 w-[300px] md:w-[350px] snap-center flex flex-col p-8 rounded-[32px] bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="mb-8">
                  <span className="text-6xl font-medium tracking-tighter text-black/20 dark:text-white/20">
                    {step.number}
                  </span>
                </div>
                <p className="mb-4 text-2xl font-medium tracking-tight text-black dark:text-white">
                  {step.label}
                </p>
                <p className="text-lg leading-relaxed text-black/70 dark:text-white/70 font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <div id="pricing" className="relative z-10 max-w-7xl mx-auto pt-32 mt-32 border-t border-black/10 dark:border-white/10 pb-12">
          <div className="mb-16 text-center md:text-left">
            <h3 className="text-[2.5rem] md:text-[3.5rem] font-medium tracking-tight text-black dark:text-white">
              Simple pricing. <span className="text-black/40 dark:text-white/40">Start free, scale when ready.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => {
              const planOrder: Record<string, number> = { free: 0, starter: 1, pro: 2 };
              const activePlanKey = isSignedIn
                ? has?.({ plan: "pro" }) ? "pro" : has?.({ plan: "starter" }) ? "starter" : "free"
                : null;

              const isActive = isSignedIn && activePlanKey === plan.key;
              const isDowngrade = isSignedIn && activePlanKey !== null && !isActive && planOrder[plan.key] < planOrder[activePlanKey];

              return (
                <div key={plan.key} className={cn(
                  "relative flex flex-col p-10 rounded-[40px] border transition-all duration-300",
                  plan.featured 
                    ? "bg-[#0E522B] text-white border-transparent shadow-[0_20px_60px_rgba(14,82,43,0.3)] hover:-translate-y-2" 
                    : "bg-white text-black border-black/10 shadow-sm hover:border-black/20 dark:bg-[#111] dark:text-white dark:border-white/10 dark:hover:border-white/20"
                )}>
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-[#FFCCFA] px-4 py-1.5 text-sm font-bold text-black shadow-sm">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-2 flex items-center gap-3">
                    <p className={cn("text-2xl font-medium", plan.featured ? "text-white" : "text-black dark:text-white")}>
                      {plan.label}
                    </p>
                    {isActive && (
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        plan.featured ? "bg-white/20 text-white" : "bg-black/10 text-black dark:bg-white/10 dark:text-white"
                      )}>
                        Active
                      </span>
                    )}
                  </div>

                  <p className={cn("mb-8 text-base font-medium", plan.featured ? "text-white/80" : "text-black/60 dark:text-white/60")}>
                    {plan.description}
                  </p>

                  <div className="mb-2 flex items-baseline gap-1">
                    <span className="text-5xl font-medium tracking-tighter">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && <span className={cn("text-lg", plan.featured ? "text-white/60" : "text-black/40 dark:text-white/40")}>/mo</span>}
                  </div>
                  
                  <p className={cn("mb-10 text-sm font-medium", plan.featured ? "text-white/60" : "text-black/40 dark:text-white/40")}>
                    {plan.price === 0 ? "Always free" : "Only billed monthly"}
                  </p>

                  <div className={cn("mb-10 space-y-4 border-t pt-8", plan.featured ? "border-white/20" : "border-black/10 dark:border-white/10")}>
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-4">
                        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", plan.featured ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/5 text-black dark:text-white")}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span className={cn("text-base font-medium", plan.featured ? "text-white/90" : "text-black/80 dark:text-white/80")}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    {isActive ? (
                      <Button disabled className="w-full h-14 rounded-full text-lg font-medium opacity-50 bg-black/5 text-black dark:bg-white/5 dark:text-white" variant="ghost">
                        ✓ Current plan
                      </Button>
                    ) : plan.price === 0 ? (
                      isSignedIn ? (
                        <Button disabled className="w-full h-14 rounded-full text-lg font-medium opacity-50 bg-black/5 text-black dark:bg-white/5 dark:text-white" variant="ghost">
                          Default plan
                        </Button>
                      ) : (
                        <SignInButton mode="modal">
                          <Button className={cn("w-full h-14 rounded-full text-lg font-medium transition-all", plan.featured ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90")}>
                            Get started free <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </SignInButton>
                      )
                    ) : isSignedIn ? (
                      <CheckoutButton planId={plan.planId} planPeriod="month" checkoutProps={{ appearance: { elements: { drawerRoot: { zIndex: 2000 } } } }}>
                        <Button className={cn("w-full h-14 rounded-full text-lg font-medium transition-all", plan.featured ? "bg-white text-black hover:bg-white/90 shadow-xl" : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90")}>
                          {isDowngrade ? "Downgrade" : "Get started"} <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </CheckoutButton>
                    ) : (
                      <SignInButton mode="modal">
                        <Button className={cn("w-full h-14 rounded-full text-lg font-medium transition-all", plan.featured ? "bg-white text-black hover:bg-white/90 shadow-xl" : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90")}>
                          Get started <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </SignInButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="relative z-10 pt-8 pb-12 mt-4 mx-auto px-6 flex flex-wrap items-center justify-center text-black/40 dark:text-white/40 font-medium">
          Made by Chetan
        </footer>
      </section>
    </main>
  );
}
