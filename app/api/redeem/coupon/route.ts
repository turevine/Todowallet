import { NextResponse } from "next/server";
import { loadAdminStore, saveAdminStore } from "@/lib/admin-store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const raw = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) {
    return NextResponse.json({ ok: false, error: "코드를 입력하세요." }, { status: 400 });
  }

  const store = await loadAdminStore();
  const c = store.coupons.find((x) => x.code.toUpperCase() === raw);
  if (!c || !c.active) {
    return NextResponse.json({ ok: false, error: "유효하지 않은 쿠폰입니다." }, { status: 400 });
  }
  if (c.expiresAt) {
    const ex = new Date(c.expiresAt).getTime();
    if (!Number.isNaN(ex) && Date.now() > ex) {
      return NextResponse.json({ ok: false, error: "만료된 쿠폰입니다." }, { status: 400 });
    }
  }
  if (c.usedCount >= c.maxUses) {
    return NextResponse.json({ ok: false, error: "사용 횟수가 모두 소진되었습니다." }, { status: 400 });
  }

  c.usedCount += 1;
  await saveAdminStore(store);

  return NextResponse.json({
    ok: true,
    couponId: c.id,
    label: c.label,
    message: `쿠폰 "${c.label}"이(가) 적용되었습니다.`,
  });
}
