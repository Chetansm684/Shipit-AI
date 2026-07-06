import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const GrayTitle = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[var(--min-text-primary)]">{children}</span>
);

export const BlueTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn("text-[var(--min-text-primary)] font-bold tracking-tight", className)}
  >
    {children}
  </span>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-3 mb-6">
    <div className="h-[1px] w-8 bg-[var(--min-border)]" />
    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--min-text-tertiary)]">
      {children}
    </span>
    <div className="h-[1px] w-8 bg-[var(--min-border)]" />
  </div>
);

export const SectionHeading = ({
  gray,
  blue,
}: {
  gray: string;
  blue: string;
}) => (
  <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05] tracking-tighter">
    <span className="text-[var(--min-text-secondary)]">{gray}</span>
    <br />
    <span className="text-[var(--min-text-primary)]">{blue}</span>
  </h2>
);

/* Minimalist single-color icon */
export const GoogleSpark = ({
  className = "h-4 w-4",
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    {animate ? (
      <Loader2 className="w-full h-full text-[var(--min-text-primary)] animate-spin" />
    ) : (
      <div className="w-2 h-2 rounded-full bg-[var(--min-text-primary)] shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
    )}
  </div>
);
