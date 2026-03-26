import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadAdminStore } from "@/lib/admin-store";

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ isAdmin: false });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ isAdmin: false, error: "server_misconfigured" }, { status: 503 });
  }

  const supabase = createClient(url, anon);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user?.email) {
    return NextResponse.json({ isAdmin: false });
  }

  const store = await loadAdminStore();
  const email = normalizeEmail(user.email);
  const isAdmin = store.appAdminEmails.some((x) => normalizeEmail(x) === email);

  return NextResponse.json({ isAdmin });
}
