import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 빌드 시 인라인되는 값 — Turbopack 캐시 등으로 비어 있을 수 있음 */
const envUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const envAnon = () => (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const SUPABASE_AUTH_STORAGE_KEY = "todowallet.auth.token";

/** `/api/auth/public-config` 로 채움 (런타임) */
let runtimeUrl = "";
let runtimeAnon = "";

export function setSupabaseRuntimeConfig(url: string, anonKey: string) {
  runtimeUrl = url.trim();
  runtimeAnon = anonKey.trim();
  client = null;
}

function resolvedUrl() {
  return envUrl() || runtimeUrl;
}

function resolvedAnon() {
  return envAnon() || runtimeAnon;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(resolvedUrl() && resolvedAnon());
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.");
  }
  const u = resolvedUrl();
  const a = resolvedAnon();
  client ??= createClient(u, a, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  });
  return client;
}
