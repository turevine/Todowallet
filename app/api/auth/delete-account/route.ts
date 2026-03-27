import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function loadEnvLocal(): Record<string, string> {
  const filePath = join(process.cwd(), ".env.local");
  if (!existsSync(filePath)) return {};
  try {
    let raw = readFileSync(filePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const out: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
    return out;
  } catch {
    return {};
  }
}

function getVar(key: string, envLocal: Record<string, string>): string {
  return (process.env[key] ?? "").trim() || (envLocal[key] ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "인증 토큰이 없습니다." }, { status: 401 });
    }

    const envLocal = loadEnvLocal();
    const url = getVar("NEXT_PUBLIC_SUPABASE_URL", envLocal);
    const serviceKey = getVar("SUPABASE_SERVICE_ROLE_KEY", envLocal);

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: `env 미설정: url=${!!url} key=${!!serviceKey}` },
        { status: 500 },
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "유효하지 않은 토큰입니다." }, { status: 401 });
    }

    await admin.from("user_wallet_data").delete().eq("user_id", user.id);

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      return NextResponse.json({ ok: false, error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 },
    );
  }
}
