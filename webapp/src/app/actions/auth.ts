"use server";

import { db } from "@/lib/db";
import { hashPassword, signIn, signOut } from "@/lib/auth";
import { toSlug } from "@/lib/utils";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(2),
});

export async function loginAction(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password format" };
  }

  const result = await signIn(parsed.data.email, parsed.data.password);

  if (result.error) {
    return { error: result.error };
  }

  return { redirect: `/dashboard` };
}

export async function registerAction(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceName: formData.get("workspaceName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, workspaceName } = parsed.data;

  // Check if email exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);
  const slug = toSlug(workspaceName) + "-" + Math.random().toString(36).slice(2, 6);

  // Create user + workspace in a transaction
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
        currency: "EUR",
        country: "DE",
      },
    });

    await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    // Create a default tax policy for Germany
    await tx.taxPolicy.create({
      data: {
        workspaceId: workspace.id,
        name: "Germany — Abgeltungsteuer 2025",
        country: "DE",
        year: 2025,
        isActive: true,
      },
    });

    // Create a default forecast assumption
    await tx.forecastAssumption.create({
      data: {
        workspaceId: workspace.id,
        name: "Base Case",
        isDefault: true,
      },
    });
  });

  // Sign in the new user
  const result = await signIn(email, password);
  if (result.error) {
    return { error: result.error };
  }

  return { redirect: `/onboarding` };
}

export async function logoutAction() {
  await signOut();
  return { redirect: "/login" };
}
