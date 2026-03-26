import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** cwd가 루트가 아닐 때 대비: route 파일 기준으로 올라가며 package.json + .env.local 이 같이 있는 폴더만 사용 */
function resolveEnvLocalPath(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 14; i++) {
    const envPath = join(dir, ".env.local");
    const pkgPath = join(dir, "package.json");
    if (existsSync(envPath) && existsSync(pkgPath)) return envPath;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const fromCwd = join(process.cwd(), ".env.local");
  const pkgCwd = join(process.cwd(), "package.json");
  if (existsSync(fromCwd) && existsSync(pkgCwd)) return fromCwd;
  return null;
}

function parseEnvFile(filePath: string): { url: string; anonKey: string } {
  let url = "";
  let anonKey = "";
  let raw = readFileSync(filePath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
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
    if (key === "NEXT_PUBLIC_SUPABASE_URL") url = val;
    if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") anonKey = val;
  }
  return { url: url.trim(), anonKey: anonKey.trim() };
}

function loadFromEnvLocal(): { url: string; anonKey: string } {
  const path = resolveEnvLocalPath();
  if (!path) return { url: "", anonKey: "" };
  try {
    return parseEnvFile(path);
  } catch {
    return { url: "", anonKey: "" };
  }
}

/** anon 키는 공개용 */
export async function GET() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  let anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    const fromFile = loadFromEnvLocal();
    url = url || fromFile.url;
    anonKey = anonKey || fromFile.anonKey;
  }
  return NextResponse.json({
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  });
}
