"use client";

import { Monitor, Smartphone } from "lucide-react";
import { GoogleSpark } from "./reusables";

export function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--gl-bg)] p-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] border-2 border-[var(--gl-border)] bg-[var(--gl-surface)] google-shadow">
        <GoogleSpark className="h-10 w-10 animate-bounce" />
      </div>
      
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--gl-text-primary)]">
        Desktop Required
      </h2>
      
      <p className="mb-8 max-w-[280px] text-[16px] font-medium leading-relaxed text-[var(--gl-text-secondary)]">
        Shipit AI&apos;s workspace is optimized for larger screens to give you the best coding experience.
      </p>
      
      <div className="flex items-center gap-4 rounded-full border border-[var(--gl-border)] bg-[var(--gl-surface)] px-6 py-3 google-shadow">
        <Smartphone className="h-5 w-5 text-[var(--gl-text-tertiary)]" />
        <div className="h-4 w-px bg-[var(--gl-border)]" />
        <Monitor className="h-5 w-5 text-[var(--gl-blue)]" />
        <span className="text-[14px] font-bold text-[var(--gl-blue)]">
          Switch to Desktop
        </span>
      </div>
    </div>
  );
}
