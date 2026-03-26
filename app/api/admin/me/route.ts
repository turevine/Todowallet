import { NextResponse } from "next/server";
import { requireAdminEmail } from "@/lib/admin-api-auth";

export async function GET() {
  const email = await requireAdminEmail();
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, email });
}
