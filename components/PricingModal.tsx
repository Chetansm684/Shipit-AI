"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRICING_PLANS } from "@/lib/constants";
import { getCurrentUserPlan } from "@/actions/billing";
import { BlueTitle, GoogleSpark } from "./reusables";

interface PricingModalProps {
  children: React.ReactNode;
  reason?: "credits" | "upgrade";
}

export function PricingModal({ children, reason }: PricingModalProps) {
  const { isSignedIn } = useUser();
  const [dbPlan, setDbPlan] = useState<string>("free");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !isOpen) return;
    getCurrentUserPlan().then((plan) => {
      if (plan) setDbPlan(plan);
    });
  }, [isSignedIn, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex focus:outline-none">{children}</DialogTrigger>

      <DialogContent className="max-w-4xl sm:max-w-4xl border-[var(--dm-border-accent)] bg-[var(--dm-surface)] p-0 overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/10">
        <DialogTitle className="sr-only">Pricing Plans</DialogTitle>

        <div className="flex flex-col h-[85vh] sm:h-auto">
          {/* Header */}
          <div className="relative border-b border-[var(--dm-border)] px-6 py-8 text-center sm:px-12 sm:py-10 bg-[var(--dm-bg)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--gl-bg)] border border-[var(--gl-border)] google-shadow">
                <GoogleSpark className="h-5 w-5" />
              </div>
              
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--dm-text-primary)] sm:text-3xl">
                {reason === "credits" ? (
                  <>You&apos;re out of <BlueTitle>credits</BlueTitle></>
                ) : (
                  <>Upgrade your <BlueTitle>workspace</BlueTitle></>
                )}
              </h2>
              
              <p className="text-sm text-[var(--dm-text-secondary)] sm:text-base max-w-sm">
                Choose a plan to get more credits, unlock premium features, and build faster.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[var(--dm-bg)] px-6 py-8 sm:px-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PRICING_PLANS.map((plan) => {
                const planOrder: Record<string, number> = {
                  free: 0,
                  starter: 1,
                  pro: 2,
                };
                const activePlanKey = isSignedIn ? dbPlan : null;

                const isActive = isSignedIn && activePlanKey === plan.key;
                const isDowngrade =
                  isSignedIn &&
                  activePlanKey !== null &&
                  !isActive &&
                  planOrder[plan.key] < planOrder[activePlanKey];

                return (
                  <div
                    key={plan.key}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-6 transition-all",
                      plan.featured
                        ? "border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-[var(--dm-surface)] shadow-xl shadow-blue-500/10"
                        : "border-[var(--dm-border-accent)] bg-[var(--dm-surface)]"
                    )}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20">
                          Recommended
                        </span>
                      </div>
                    )}

                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--dm-text-primary)]">
                        {plan.label}
                      </p>
                      {isActive && (
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="mb-5 text-xs text-[var(--dm-text-secondary)]">
                      {plan.description}
                    </p>

                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--dm-text-primary)]">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-xs text-[var(--dm-text-tertiary)]">/mo</span>
                      )}
                    </div>
                    <p className="mb-6 text-[11px] text-[var(--dm-text-tertiary)]">
                      {plan.price === 0 ? "Always free" : "Only billed monthly"}
                    </p>

                    <div className="mb-8 space-y-3 border-t border-[var(--dm-border)] pt-5">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                              plan.featured ? "bg-blue-500/20" : "bg-[var(--dm-surface-elevated)]"
                            )}
                          >
                            <Check
                              className={cn(
                                "h-2.5 w-2.5",
                                plan.featured ? "text-blue-400" : "text-[var(--dm-text-tertiary)]"
                              )}
                            />
                          </div>
                          <span className="text-xs leading-relaxed text-[var(--dm-text-secondary)]">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-4">
                      {isActive ? (
                        <Button
                          disabled
                          className="w-full rounded-full text-xs font-semibold opacity-50 border border-[var(--dm-border)] bg-transparent"
                          variant="ghost"
                        >
                          ✓ Current plan
                        </Button>
                      ) : plan.price === 0 ? (
                        <Button
                          disabled
                          className="w-full rounded-full text-xs font-semibold opacity-50 border border-[var(--dm-border)] bg-transparent"
                          variant="ghost"
                        >
                          Default plan
                        </Button>
                      ) : (
                        <CheckoutButton
                          planId={plan.planId}
                          planPeriod="month"
                        >
                          <Button
                            className={cn(
                              "w-full rounded-full text-xs font-semibold transition-all group",
                              plan.featured
                                ? "bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20"
                                : "border border-[var(--dm-border-accent)] bg-transparent text-[var(--dm-text-secondary)] hover:bg-blue-500/5 hover:text-[var(--dm-text-primary)] hover:border-blue-500/30"
                            )}
                            variant="ghost"
                          >
                            {isDowngrade ? "Downgrade" : "Upgrade"}
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5 opacity-70 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CheckoutButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
