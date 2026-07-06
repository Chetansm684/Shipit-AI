# Shipit AI — Full-Stack Agentic App Builder 🚀

A next-generation, full-stack AI-powered React application generator. Users describe their app ideas in plain English, and the platform instantly generates production-ready, beautiful React + Tailwind code that renders live in the browser. 

Inspired by platforms like Bolt.new and Lovable, it integrates persistent workspace histories, smart npm package validation, an in-browser live Sandpack preview, and a credit-based subscription model with Clerk billing.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Database Structure](#database-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## Overview

Shipit AI is designed to help developers and designers bootstrap functional, interactive components and layouts instantly. 

The workspace split-panel layout features an AI Chat assistant on the left, and an interactive Sandpack Code Editor + Live Browser Preview on the right. When the browser preview throws compilation or runtime errors, a visual banner offers **Auto-Fix with AI**, sending the stack trace back to the model to resolve the bug automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, TS, utilizing the new `proxy.ts` middleware standard) |
| **Authentication** | Clerk (Google OAuth, User Sync) |
| **Billing** | Clerk Billing Toggle (Free, Starter, Pro tiers) |
| **Database + ORM** | Supabase PostgreSQL + Prisma ORM |
| **File Storage** | Supabase Storage (Visual mockup uploads) |
| **Security WAF** | Arcjet (Bot detection, Rate limiting, Prompt injection protection) |
| **AI Models** | Gemini 3.1 Flash Lite (Fast suggestions & layout generation) |
| **AI Agent Interface** | `@cline/sdk` (For multi-file workspace improvements) |
| **Iframe Bundler** | `@codesandbox/sandpack-react` (Live preview container) |
| **Styling** | Tailwind CSS v4 |

---

## Key Features

### 1. Dynamic AI Suggestions
*   Rotating suggestions on the landing page are pulled dynamically from Gemini.
*   Includes a visual source badge:
    *   `✨ Live AI trends` (Pulsing green indicator): When suggestions are fetched fresh from Gemini.
    *   `📋 Default suggestions` (Amber indicator): Rotates a pool of 12 developer-focused fallback templates if the Gemini API is offline or rate-limited.

### 2. Multimodal Vision Prompts
*   True image-aware prompts are fully active.
*   When a screenshot or layout mockup is uploaded (stored securely in the Supabase `WORKSPACE-IMAGES` bucket), the file is fetched, encoded into Base64, and sent to Gemini as `inlineData` parts for actual visual design parsing.

### 3. Vibrant Light-Theme UI Defaults
*   System instructions mandate that generated components default to clean, high-fidelity light modes or colorful layouts.
*   Incorporates premium accents, gradients, glassmorphism, and responsive Tailwind templates, strictly avoiding simple or basic grayscale layouts.

### 4. Sandpack Code Mirror & Live Editing
*   Allows the user to browse every generated file.
*   Edit code directly in the code tab and watch the live preview re-render instantly without remounting the provider.
*   Export to a ZIP package containing a complete standard React project.

### 5. Smart npm Package Checker
*   Hallucinated or invalid package imports are caught and filtered out by querying the official `npmjs.org` registry before rendering the files.

---

## Database Structure

The database configuration utilizes two primary Postgres tables managed by Prisma:

*   **User**: Handles auth sync from Clerk, credits tracking, and subscription tiers.
*   **Workspace**: Stores project titles, persistent chat history messages, and the current file/dependency JSON payload.
*   **Storage Bucket**: `WORKSPACE-IMAGES` on Supabase Storage (Public bucket with custom RLS rules for anonymous SELECT and INSERT operations).

---

## Getting Started

### Prerequisites

*   Node.js 22+
*   PostgreSQL Database (Supabase)
*   Clerk Account + API Keys
*   Google AI Studio API Key (Gemini)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/piyush-eon/ai-app-builder.git
   cd ai-app-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Sync database tables:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the root folder:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publish-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Database Connection (Direct and URL)
DATABASE_URL=postgresql://user:password@localhost:5432/forge
DIRECT_URL=postgresql://user:password@localhost:5432/forge

# Gemini AI Studio Key
GEMINI_API_KEY=your-google-gemini-api-key

# Arcjet Protection
ARCJET_KEY=your-arcjet-secret-key

# Clerk Billing Toggle
NEXT_PUBLIC_CLERK_BILLING_ENABLED=true
```

---

## 🌟 Show your support

Give a ⭐ if this project helped you learn full-stack agentic development!

*Made with ❤️ by Chetan*
