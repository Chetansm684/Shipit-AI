"use client";

import Link from "next/link";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

export default function Header() {
  const { isSignedIn } = useAuth();

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="pointer-events-auto flex h-14 items-center justify-between rounded-full border border-[var(--min-border)] bg-[var(--min-surface)]/80 px-6 backdrop-blur-xl min-shadow w-full max-w-4xl"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <div className="h-2 w-2 rounded-full bg-[var(--min-text-primary)] transition-transform duration-300 group-hover:scale-150" />
          <span className="text-[14px] font-semibold tracking-tight text-[var(--min-text-primary)]">
            Shipit AI
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <Link href="/#features" className="text-[13px] font-medium text-[var(--min-text-secondary)] hover:text-[var(--min-text-primary)] transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-[13px] font-medium text-[var(--min-text-secondary)] hover:text-[var(--min-text-primary)] transition-colors">
            Pricing
          </Link>
          <Link href="/projects" className="text-[13px] font-medium text-[var(--min-text-secondary)] hover:text-[var(--min-text-primary)] transition-colors">
            Projects
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {isSignedIn ? (
            <>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  className="text-[13px] font-medium text-[var(--min-text-secondary)] hover:text-[var(--min-text-primary)] hover:bg-[var(--min-bg-subtle)] rounded-full px-4 h-8"
                >
                  Log in
                </Button>
              </SignInButton>

              <SignInButton mode="modal">
                <Button
                  className="h-8 rounded-full bg-[var(--min-text-primary)] px-5 text-[12px] font-semibold text-[var(--min-bg)] hover:bg-[var(--min-text-secondary)] transition-all min-shadow"
                >
                  Start Building
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </motion.header>
    </div>
  );
}
