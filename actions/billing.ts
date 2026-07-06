"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";


export async function getCurrentUserPlan(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { plan: true },
    });
    return user?.plan ?? "free";
  } catch (error) {
    console.error("getCurrentUserPlan error:", error);
    return "free";
  }
}
