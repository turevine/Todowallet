import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdminSessionSecret, verifyAdminToken } from "@/lib/admin-session";

export default async function AdminIndexPage() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = getAdminSessionSecret();
  if (secret && verifyAdminToken(token, secret)) {
    redirect("/admin/dashboard");
  }
  redirect("/admin/login");
}
