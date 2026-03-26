import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/admin-api-auth";
import { loadAdminStore, saveAdminStore } from "@/lib/admin-store";

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function GET() {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
  const store = await loadAdminStore();
  return NextResponse.json({ ok: true, emails: store.appAdminEmails });
}

export async function POST(req: Request) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const raw = normalizeEmail(String(body.email ?? ""));
  if (!raw || !emailOk(raw)) {
    return NextResponse.json({ ok: false, error: "유효한 이메일을 입력하세요." }, { status: 400 });
  }

  const store = await loadAdminStore();
  if (store.appAdminEmails.some((x) => normalizeEmail(x) === raw)) {
    return NextResponse.json({ ok: false, error: "이미 등록된 이메일입니다." }, { status: 400 });
  }
  store.appAdminEmails.push(raw);
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, emails: store.appAdminEmails });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const raw = normalizeEmail(String(body.email ?? ""));
  if (!raw) {
    return NextResponse.json({ ok: false, error: "email 필요" }, { status: 400 });
  }

  const store = await loadAdminStore();
  const next = store.appAdminEmails.filter((x) => normalizeEmail(x) !== raw);
  if (next.length === store.appAdminEmails.length) {
    return NextResponse.json({ ok: false, error: "목록에 없는 이메일입니다." }, { status: 404 });
  }
  store.appAdminEmails = next;
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, emails: store.appAdminEmails });
}
