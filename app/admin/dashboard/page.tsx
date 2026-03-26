"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminCoupon } from "@/lib/admin-store";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [appAdminEmails, setAppAdminEmails] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");

  const [cCode, setCCode] = useState("");
  const [cLabel, setCLabel] = useState("");
  const [cMax, setCMax] = useState("100");
  const [cExp, setCExp] = useState("");

  const [newAdminEmail, setNewAdminEmail] = useState("");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    setLoadError("");
    const [me, cr, ar] = await Promise.all([
      fetch("/api/admin/me"),
      fetch("/api/admin/coupons"),
      fetch("/api/admin/app-admins"),
    ]);
    if (!me.ok) {
      router.replace("/admin/login");
      return;
    }
    const mj = (await me.json()) as { email?: string };
    setEmail(mj.email ?? null);
    if (cr.ok) {
      const cj = (await cr.json()) as { coupons?: AdminCoupon[] };
      setCoupons(cj.coupons ?? []);
    }
    if (ar.ok) {
      const aj = (await ar.json()) as { emails?: string[] };
      setAppAdminEmails(aj.emails ?? []);
    }
    if (!cr.ok || !ar.ok) setLoadError("목록을 불러오지 못했습니다.");
  }, [router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setToast("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cCode,
          label: cLabel,
          maxUses: Number(cMax) || 1,
          expiresAt: cExp || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setToast(data.error ?? "생성 실패");
        return;
      }
      setToast("쿠폰이 발행되었습니다.");
      setCCode("");
      setCLabel("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addAppAdmin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setToast("");
    try {
      const res = await fetch("/api/admin/app-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; emails?: string[] };
      if (!data.ok) {
        setToast(data.error ?? "추가 실패");
        return;
      }
      setToast("앱 관리자 이메일을 추가했습니다.");
      setNewAdminEmail("");
      setAppAdminEmails(data.emails ?? []);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeAppAdmin(addr: string) {
    setBusy(true);
    setToast("");
    try {
      const res = await fetch("/api/admin/app-admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addr }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setToast(data.error ?? "제거 실패");
        return;
      }
      setToast("제거했습니다.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleCoupon(id: string, active: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await refresh();
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setToast("복사했습니다.");
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">TodoWallet Admin</h1>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              메인 앱
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {toast ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{toast}</div>
        ) : null}
        {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-base font-bold text-white">쿠폰 코드 발행</h2>
          <p className="mt-1 text-sm text-slate-400">
            사용자는 메인 앱 → 프로필 → 설정에서 코드를 입력해 등록합니다. (서버에 사용 횟수가 집계됩니다.)
          </p>
          <form onSubmit={createCoupon} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">코드 (대문자 권장)</label>
              <input
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                placeholder="예: WELCOME2025"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">설명 라벨</label>
              <input
                value={cLabel}
                onChange={(e) => setCLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                placeholder="예: 신규 환영 쿠폰"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">최대 사용 횟수</label>
              <input
                type="number"
                min={1}
                value={cMax}
                onChange={(e) => setCMax(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">만료일 (선택, YYYY-MM-DD)</label>
              <input
                type="date"
                value={cExp}
                onChange={(e) => setCExp(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                쿠폰 발행
              </button>
            </div>
          </form>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-2 pr-4">코드</th>
                  <th className="py-2 pr-4">라벨</th>
                  <th className="py-2 pr-4">사용</th>
                  <th className="py-2 pr-4">상태</th>
                  <th className="py-2">동작</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/80 text-slate-300">
                    <td className="py-3 pr-4 font-mono">
                      {c.code}
                      <button type="button" className="ml-2 text-amber-500/80 hover:text-amber-400" onClick={() => copy(c.code)}>
                        복사
                      </button>
                    </td>
                    <td className="py-3 pr-4">{c.label}</td>
                    <td className="py-3 pr-4">
                      {c.usedCount} / {c.maxUses}
                    </td>
                    <td className="py-3 pr-4">{c.active ? "활성" : "비활성"}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="text-xs text-slate-400 underline"
                        onClick={() => void toggleCoupon(c.id, !c.active)}
                      >
                        {c.active ? "비활성화" : "활성화"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coupons.length === 0 ? <p className="mt-4 text-sm text-slate-500">등록된 쿠폰이 없습니다.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-base font-bold text-white">메인 앱 관리자 (이메일)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Supabase에 <strong className="text-slate-300">회원가입한 이메일</strong>을 아래에 추가하면, 해당 계정으로 메인 앱에 로그인했을 때 관리자 배지가 표시됩니다. 코드 입력은 필요 없습니다.
          </p>
          <form onSubmit={addAppAdmin} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500">이메일 주소</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                placeholder="user@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 sm:shrink-0"
            >
              권한 부여
            </button>
          </form>

          <ul className="mt-6 space-y-2">
            {appAdminEmails.map((addr) => (
              <li
                key={addr}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
              >
                <span className="font-mono text-xs sm:text-sm">{addr}</span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-400 underline hover:text-red-300"
                  disabled={busy}
                  onClick={() => void removeAppAdmin(addr)}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
          {appAdminEmails.length === 0 ? <p className="mt-4 text-sm text-slate-500">등록된 관리자 이메일이 없습니다.</p> : null}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-500">
          <h3 className="font-semibold text-slate-300">안내</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>이 대시보드 로그인(ADMIN_EMAIL / ADMIN_PASSWORD)은 `.env.local`에만 두세요. Git에 올리지 마세요.</li>
            <li>쿠폰·관리자 이메일 목록은 서버의 `data/admin-store.json`에 저장됩니다.</li>
            <li>메인 앱 로그인은 Supabase Auth 이메일과 일치해야 관리자로 인식됩니다.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
