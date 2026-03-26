"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/90">TodoWallet</p>
        <h1 className="mt-2 text-2xl font-bold text-white">관리자 로그인</h1>
        <p className="mt-2 text-sm text-slate-400">메인 앱과 별도의 관리 전용 페이지입니다.</p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">이메일</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/40"
              placeholder="ceo@todowallet.net"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/40"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/30 disabled:opacity-50"
          >
            {loading ? "확인 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          <Link href="/" className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
            TodoWallet 메인으로
          </Link>
        </p>
      </div>
    </div>
  );
}
