import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminPasswordMatches,
  getAdminSessionSecret,
  signAdminSession,
} from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  const secret = getAdminSessionSecret();

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_SESSION_SECRET이 설정되지 않았습니다." },
      { status: 500 },
    );
  }
  if (!adminEmail || !adminPass) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_EMAIL / ADMIN_PASSWORD 환경 변수를 확인하세요." },
      { status: 500 },
    );
  }
  if (email !== adminEmail || !adminPasswordMatches(password, adminPass)) {
    return NextResponse.json({ ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = signAdminSession(email, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
