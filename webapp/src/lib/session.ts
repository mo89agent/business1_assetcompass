// Lightweight session module — Edge-runtime safe (no bcryptjs/Node.js-only modules)
// Used by middleware for JWT verification

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ac_session";

export interface SessionPayload {
  userId: string;
  workspaceId: string;
  email: string;
  name: string | null;
  role: string;
  exp?: number;
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-in-production"
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
