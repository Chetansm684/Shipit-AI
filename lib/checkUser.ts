import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { PLANS } from "./constants";
import type { Plan } from "@/types/plans";

const getCurrentPlan = async (): Promise<Plan> => {
  const { has } = await auth();
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";
  return "free";
};

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const currentPlan = await getCurrentPlan();

    const existing = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (existing) {
      const now = new Date();
      const lastRefill = new Date(existing.lastRefillAt);
      
      const isNewDay = 
        now.getFullYear() !== lastRefill.getFullYear() ||
        now.getMonth() !== lastRefill.getMonth() ||
        now.getDate() !== lastRefill.getDate();

      let currentCredits = existing.credits;
      let currentDbPlan = existing.plan;
      let lastRefillAtVal = existing.lastRefillAt;

      // Handle daily refill
      if (isNewDay) {
        const refillAmount = PLANS[currentDbPlan as Plan]?.credits ?? PLANS.free.credits;

        currentCredits = Math.max(currentCredits, refillAmount);
        lastRefillAtVal = now;
      }

      // Sync upgrades from Clerk (Clerk plan has higher precedence)
      const planHierarchy: Record<Plan, number> = {
        free: 0,
        starter: 1,
        pro: 2,
      };

      if (planHierarchy[currentPlan] > planHierarchy[currentDbPlan as Plan]) {
        // Clerk plan is an upgrade
        const existingPlanCredits = PLANS[currentDbPlan as Plan]?.credits ?? 0;
        const newPlanCredits = PLANS[currentPlan].credits;
        const creditDelta = newPlanCredits - existingPlanCredits;

        currentDbPlan = currentPlan;
        if (creditDelta > 0) {
          currentCredits += creditDelta;
        }
      }

      // If anything changed, write it to database
      if (
        currentCredits !== existing.credits ||
        currentDbPlan !== existing.plan ||
        lastRefillAtVal.getTime() !== existing.lastRefillAt.getTime()
      ) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            credits: currentCredits,
            plan: currentDbPlan,
            lastRefillAt: lastRefillAtVal,
          },
        });
        
        // Re-fetch to return fresh record
        return await db.user.findUnique({ where: { clerkId: user.id } });
      }

      return existing;
    }

    // New user — create with free plan credits
    return await db.user.create({
      data: {
        clerkId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl ?? "",
        credits: PLANS.free.credits,
        plan: "free",
        lastRefillAt: new Date(),
      },
    });
  } catch (error) {
    console.error("checkUser error:", error);
    return null;
  }
};
