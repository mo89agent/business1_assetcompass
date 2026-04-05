import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  SessionPayload,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

export type { SessionPayload };

// ─── Get current session from cookie (cached per request) ────
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

// ─── Set session cookie ──────────────────────────────────────
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

// ─── Clear session cookie ────────────────────────────────────
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ─── Hash / verify password ──────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Auth actions ────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return { error: "Invalid credentials" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  // Get first workspace membership
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (!membership) return { error: "No workspace found for this account" };

  const token = await createSessionToken({
    userId: user.id,
    workspaceId: membership.workspaceId,
    email: user.email,
    name: user.name,
    role: membership.role,
  });

  await setSessionCookie(token);
  return { success: true, workspaceSlug: membership.workspace.slug };
}

export async function signOut() {
  await clearSessionCookie();
}
