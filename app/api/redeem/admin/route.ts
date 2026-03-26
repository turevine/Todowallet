import { NextResponse } from "next/server";
import { loadAdminStore, saveAdminStore } from "@/lib/admin-store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const raw = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) {
    return NextResponse.json({ ok: false, error: "코드를 입력하세요." }, { status: 400 });
  }

  const store = await loadAdminStore();
  const c = store.privilegeCodes.find((x) => x.code.toUpperCase() === raw);
  if (!c || !c.active) {
    return NextResponse.json({ ok: false, error: "유효하지 않은 권한 코드입니다." }, { status: 400 });
  }
  if (c.expiresAt) {
    const ex = new Date(c.expiresAt).getTime();
    if (!Number.isNaN(ex) && Date.now() > ex) {
      return NextResponse.json({ ok: false, error: "만료된 코드입니다." }, { status: 400 });
    }
  }
  if (c.usedCount >= c.maxUses) {
    return NextResponse.json({ ok: false, error: "이 코드는 더 이상 사용할 수 없습니다." }, { status: 400 });
  }

  c.usedCount += 1;
  await saveAdminStore(store);

  return NextResponse.json({
    ok: true,
    message: "관리자 전용 권한이 이 기기에 부여되었습니다.",
  });
}
