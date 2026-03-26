import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/admin-api-auth";
import {
  generatePrivilegeCode,
  loadAdminStore,
  newId,
  saveAdminStore,
  type AdminPrivilegeCode,
} from "@/lib/admin-store";

export async function GET() {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const store = await loadAdminStore();
  return NextResponse.json({ ok: true, codes: store.privilegeCodes });
}

export async function POST(req: Request) {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    maxUses?: number;
    expiresAt?: string | null;
    note?: string;
    code?: string;
  };

  const maxUses = Math.max(1, Math.min(10_000, Number(body.maxUses) || 1));
  const expiresAt =
    body.expiresAt && String(body.expiresAt).trim() ? String(body.expiresAt).trim() : null;
  const note = String(body.note ?? "").trim() || undefined;

  let code = String(body.code ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!code) {
    code = generatePrivilegeCode();
  }

  const store = await loadAdminStore();
  if (store.privilegeCodes.some((c) => c.code.toUpperCase() === code)) {
    return NextResponse.json({ ok: false, error: "이미 같은 코드가 있습니다." }, { status: 400 });
  }

  const row: AdminPrivilegeCode = {
    id: newId(),
    code,
    maxUses,
    usedCount: 0,
    expiresAt,
    active: true,
    createdAt: new Date().toISOString(),
    note,
  };
  store.privilegeCodes.push(row);
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, privilegeCode: row });
}

export async function PATCH(req: Request) {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean };
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "id 필요" }, { status: 400 });

  const store = await loadAdminStore();
  const c = store.privilegeCodes.find((x) => x.id === id);
  if (!c) return NextResponse.json({ ok: false, error: "없음" }, { status: 404 });
  if (typeof body.active === "boolean") c.active = body.active;
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, privilegeCode: c });
}
