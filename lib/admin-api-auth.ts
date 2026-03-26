import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminSessionSecret, verifyAdminToken } from "@/lib/admin-session";

export async function requireAdminEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = getAdminSessionSecret();
  const v = verifyAdminToken(token, secret);
  return v?.email ?? null;
}
