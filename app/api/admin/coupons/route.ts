import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/admin-api-auth";
import { loadAdminStore, newId, saveAdminStore, type AdminCoupon } from "@/lib/admin-store";

export async function GET() {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const store = await loadAdminStore();
  return NextResponse.json({ ok: true, coupons: store.coupons });
}

export async function POST(req: Request) {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    label?: string;
    maxUses?: number;
    expiresAt?: string | null;
  };

  const code = String(body.code ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const label = String(body.label ?? "").trim() || "쿠폰";
  const maxUses = Math.max(1, Math.min(1_000_000, Number(body.maxUses) || 1));
  const expiresAt =
    body.expiresAt && String(body.expiresAt).trim() ? String(body.expiresAt).trim() : null;

  if (!code || code.length < 3) {
    return NextResponse.json({ ok: false, error: "코드는 3자 이상이어야 합니다." }, { status: 400 });
  }

  const store = await loadAdminStore();
  if (store.coupons.some((c) => c.code.toUpperCase() === code)) {
    return NextResponse.json({ ok: false, error: "이미 같은 코드가 있습니다." }, { status: 400 });
  }

  const row: AdminCoupon = {
    id: newId(),
    code,
    label,
    maxUses,
    usedCount: 0,
    expiresAt,
    active: true,
    createdAt: new Date().toISOString(),
  };
  store.coupons.push(row);
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, coupon: row });
}

export async function PATCH(req: Request) {
  const email = await requireAdminEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean };
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "id 필요" }, { status: 400 });

  const store = await loadAdminStore();
  const c = store.coupons.find((x) => x.id === id);
  if (!c) return NextResponse.json({ ok: false, error: "없음" }, { status: 404 });
  if (typeof body.active === "boolean") c.active = body.active;
  await saveAdminStore(store);
  return NextResponse.json({ ok: true, coupon: c });
}
