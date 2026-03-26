import { createHmac, timingSafeEqual, createHash } from "crypto";

export const ADMIN_COOKIE = "tw_admin";

export function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export function signAdminSession(email: string, secret: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ email, exp }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null, secret: string): { email: string } | null {
  if (!token || !secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; exp?: number };
    if (!obj.email || typeof obj.exp !== "number" || Date.now() > obj.exp) return null;
    return { email: obj.email };
  } catch {
    return null;
  }
}

export function adminPasswordMatches(input: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}
