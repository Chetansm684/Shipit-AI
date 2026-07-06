export const PLANS = {
  free: {
    label: "Free",
    credits: 50,
    price: 0,
  },
  starter: {
    label: "Starter",
    credits: 300,
    price: 9,
  },
  pro: {
    label: "Pro",
    credits: 1500,
    price: 29,
  },
} as const;

// Fallback cost if model not found
export const CREDIT_COST_PER_GENERATION = 1;

export const MODEL_CREDIT_COSTS: Record<string, number> = {
  "gemini-3.5-pro": 30,    // 1500 Flash limit / 50 Pro limit = 30x cost multiplier
  "gemini-3.5-flash": 1,   // Fast and efficient, base cost
  "deepseek-v4-flash": 1,  // Base cost for DeepSeek V4 Flash
  "deepseek-v4-pro": 30,   // Pro cost for DeepSeek V4 Pro
  "gpt-oss-120b": 30,      // High capability model
};

export const MIN_CREDITS_TO_GENERATE = 1;

const isProEnabled = process.env.NEXT_PUBLIC_ENABLE_GEMINI_3_5_PRO === "true";

export const PRICING_PLANS = [
  {
    key: "free",
    label: "Free",
    description: "Start building. Refilled daily.",
    price: 0,
    featured: false,
    planId: null,
    active: true,
    features: [
      isProEnabled ? "50 credits/day (50 Flash runs, Pro restricted)" : "50 credits/day",
      "Live preview",
      "Export to zip"
    ],
  },
  {
    key: "starter",
    label: "Starter",
    description: "For developers who build regularly.",
    price: 9,
    featured: true,
    planId: "cplan_3G2uUm0fVf1nBRgzZoAn8qJbjDD",
    active: false,
    features: [
      isProEnabled ? "300 credits/day (300 Flash or 10 Pro runs)" : "300 credits/day",
      "Image uploads",
      "Live preview",
      "Export to zip",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    description: "For power users who ship fast.",
    price: 29,
    featured: false,
    planId: "cplan_3G2uZtJ7wkPY2K1pH2kB05SV8kk",
    active: false,
    features: [
      isProEnabled ? "1500 credits/day (1500 Flash or 50 Pro runs)" : "1500 credits/day",
      "Access to Shipit Pro Agent",
      "Image uploads",
      "Live preview",
      "Export to zip",
    ],
  },
] as const;

export const GEMINI_MODELS = process.env.NEXT_PUBLIC_ENABLE_GEMINI_3_5_PRO === "true"
  ? [
      {
        id: "gemini-3.5-pro",
        name: "Gemini 3.5 Pro",
        description: "Google's newest and most capable reasoning model",
      },
      {
        id: "gemini-3.5-flash",
        name: "Gemini 3.5 Flash",
        description: "Google's newest fast and capable model",
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        description: "DeepSeek's fast reasoning model",
      },
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        description: "DeepSeek's most capable reasoning model",
      },
      {
        id: "gpt-oss-120b",
        name: "GPT OSS 120B",
        description: "OpenAI's large 120B model",
      },
    ] as const
  : [
      {
        id: "gemini-3.5-flash",
        name: "Gemini 3.5 Flash",
        description: "Google's newest fast and capable model",
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        description: "DeepSeek's fast reasoning model",
      },
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        description: "DeepSeek's most capable reasoning model",
      },
      {
        id: "gpt-oss-120b",
        name: "GPT OSS 120B",
        description: "OpenAI's large 120B model",
      },
    ] as const;
