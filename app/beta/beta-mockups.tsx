"use client";

import { Crown, Play, Pause, Coffee, Check, Archive } from "lucide-react";

const GOLD_RIBBON =
  "linear-gradient(90deg, #8B6914 0%, #D4AF37 18%, #FFD700 38%, #FFF4B8 50%, #FFD700 62%, #C5A028 82%, #7A5C0C 100%)";
const SILVER_RIBBON =
  "linear-gradient(90deg, #4B5563 0%, #9CA3AF 22%, #E8EAEF 48%, #F9FAFB 52%, #C4C8D0 72%, #6B7280 100%)";

/* ─── 폰 프레임 (큰 사이즈) ─── */
export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[380px] ${className}`} aria-hidden>
      <div className="relative overflow-hidden rounded-[3rem] border-[6px] border-zinc-900 bg-[#0c0b14] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="absolute left-1/2 top-0 z-50 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
        <div className="relative min-h-[620px] overflow-hidden bg-[#0f0e17] pt-10 pb-4">
          {children}
        </div>
        <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ─── 1) 홈: 카드 스택 + 타이머 + 목표 배너 ─── */
export function ScreenHome() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {/* 주간 히트맵 상단 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/50">이번 주 몰입</span>
          <span className="text-[10px] text-white/30">3월 4주차</span>
        </div>
        <div className="flex justify-between gap-1.5">
          {["월","화","수","목","금","토","일"].map((d, i) => {
            const lvl = [2,3,3,1,3,2,0][i];
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="aspect-square w-full rounded-lg"
                  style={{
                    background: lvl === 0 ? "rgba(244,63,94,0.08)" : lvl === 1 ? "rgba(244,63,94,0.25)" : lvl === 2 ? "rgba(244,63,94,0.5)" : "rgba(244,63,94,0.8)",
                    boxShadow: lvl >= 2 ? "0 0 8px rgba(244,63,94,0.3)" : undefined
                  }}
                />
                <span className="text-[9px] text-white/40">{d}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[10px] text-white/30">5일 집중 · 총 8h 32m</p>
      </div>

      {/* 목표 배너 */}
      <div className="rounded-2xl p-3.5" style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.18), rgba(244,63,94,0.06))", border: "1px solid rgba(244,63,94,0.35)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-wide text-white/50">영어 회화 마스터 목표</span>
          <span className="rounded-lg bg-rose-500/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">D-7</span>
        </div>
        <p className="text-[13px] font-semibold text-white">토익 850점 달성하기</p>
        <p className="mt-1 font-mono text-[10px] text-white/40">기한 2026-04-04</p>
      </div>

      {/* 마스터 필터 */}
      <div className="flex gap-2 overflow-hidden">
        <span className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold" style={{ background: "rgba(244,63,94,0.15)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.3)" }}>전체 (4)</span>
        <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/50">영어 회화</span>
        <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/50">운동</span>
      </div>

      {/* 카드 스택 */}
      <div className="relative h-[310px] w-full">
        {/* 마스터 카드 */}
        <div
          className="absolute inset-x-0 top-0 z-30 rounded-2xl border border-white/15 p-4 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", aspectRatio: "85.6 / 53.98" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] text-white/40">MASTER</span>
              <p className="mt-0.5 text-[17px] font-bold leading-tight text-[#E8E8FF]">영어 회화 마스터</p>
            </div>
            <Crown className="size-5 text-amber-300/80" />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[22px] font-bold tabular-nums text-white/90" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>48h 32m</p>
              <p className="text-[10px] text-white/40">총 집중 시간</p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.15)" }} />
          </div>
        </div>

        {/* 일반카드 1 — 집중 중 */}
        <div
          className="absolute inset-x-0 top-[105px] z-20 rounded-2xl border border-white/12 p-4 shadow-xl"
          style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #1e3a5f 100%)", aspectRatio: "85.6 / 53.98" }}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-[0.1em] text-white/40">영어 회화 마스터</span>
          </div>
          <p className="mt-0.5 text-[15px] font-bold text-[#A8FFCE]">리스닝 30분 연습</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <Play className="size-3 fill-emerald-300 text-emerald-300" />
              집중 중
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-white/85" style={{ textShadow: "0 0 12px rgba(16,185,129,0.4)" }}>00:18:42</span>
          </div>
        </div>

        {/* 일반카드 2 — 대기 */}
        <div
          className="absolute inset-x-0 top-[210px] z-10 rounded-2xl border border-white/10 p-3 opacity-80 shadow-lg"
          style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #3d0c02 50%, #1a0505 100%)", aspectRatio: "85.6 / 53.98" }}
        >
          <span className="text-[10px] font-bold tracking-[0.1em] text-white/30">영어 회화 마스터</span>
          <p className="mt-0.5 text-[14px] font-bold text-[#FFB5A7]">단어 50개 암기</p>
          <p className="mt-1 font-mono text-[11px] text-white/40">1h 20m 누적</p>
        </div>
      </div>

      {/* 하단 네비 */}
      <div className="mt-auto flex items-center justify-around rounded-2xl border border-white/10 bg-white/[0.04] py-3">
        <div className="flex flex-col items-center gap-0.5">
          <div className="size-5 rounded-md bg-white/20" />
          <span className="text-[10px] font-semibold text-white/80">홈</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Archive className="size-5 text-white/30" />
          <span className="text-[10px] font-semibold text-white/30">보관함</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 2) 집중 모드: 타이머 확대 + 휴식 ─── */
export function ScreenTimer() {
  return (
    <div className="flex flex-col items-center gap-5 px-4 pt-4">
      {/* 상단 카드 확대 */}
      <div
        className="w-full rounded-2xl border border-white/15 p-5 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #1e3a5f 100%)" }}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.1em] text-white/40">영어 회화 마스터</span>
          <span className="text-[10px] font-bold text-emerald-400">집중 중</span>
        </div>
        <p className="text-lg font-bold text-[#A8FFCE]">리스닝 30분 연습</p>

        <div className="mt-6 flex flex-col items-center">
          <p className="font-mono text-5xl font-bold tabular-nums text-white" style={{ textShadow: "0 0 30px rgba(16,185,129,0.35)" }}>
            00:18:42
          </p>
          <p className="mt-2 text-[11px] text-white/40">오늘 집중 시간</p>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button className="flex size-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg" type="button">
            <Pause className="size-6 text-white/90" />
          </button>
          <button className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 shadow-lg" type="button">
            <Coffee className="size-6 text-amber-300" />
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/30">일시정지 · 휴식 타이머</p>
      </div>

      {/* 체크리스트 */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-[11px] font-bold text-white/50">체크리스트</p>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <div className="flex size-5 items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/15">
              <Check className="size-3 text-emerald-400" />
            </div>
            <span className="text-sm text-white/60 line-through">파트 1 ~ 3 풀기</span>
          </label>
          <label className="flex items-center gap-3">
            <div className="size-5 rounded-md border border-white/20" />
            <span className="text-sm text-white/90">오답 정리 & 복습</span>
          </label>
          <label className="flex items-center gap-3">
            <div className="size-5 rounded-md border border-white/20" />
            <span className="text-sm text-white/90">쉐도잉 10분</span>
          </label>
        </div>
      </div>

      {/* 세션 요약 */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/50">오늘 세션</span>
          <span className="font-mono font-semibold text-white/70">3회 · 총 1h 42m</span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <div className="h-2 flex-[3] rounded-full bg-emerald-500/60" />
          <div className="h-2 flex-[1] rounded-full bg-amber-400/40" />
          <div className="h-2 flex-[2] rounded-full bg-emerald-500/40" />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-white/30">
          <span>집중</span>
          <span>휴식</span>
          <span>집중</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 3) 스와이프 완료 연출 ─── */
export function ScreenSwipeComplete() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <p className="text-center text-[11px] font-semibold text-white/40">카드를 스와이프하면</p>

      {/* 완료 (오른쪽) */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-2xl bg-emerald-500/20">
          <Check className="size-6 text-emerald-400" />
        </div>
        <div
          className="relative z-10 w-[85%] rounded-2xl border border-white/15 p-4 shadow-xl transition-transform"
          style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #1e3a5f 100%)", transform: "translateX(32px)" }}
        >
          <span className="text-[10px] font-bold tracking-[0.1em] text-white/40">영어 회화 마스터</span>
          <p className="mt-0.5 text-[15px] font-bold text-[#A8FFCE]">리스닝 30분 연습</p>
          <p className="mt-1 font-mono text-[12px] text-white/60">1h 42m 집중</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-emerald-500/20" />
        <span className="text-[10px] font-bold text-emerald-400">→ 오른쪽 스와이프 = 완료</span>
        <div className="h-px flex-1 bg-emerald-500/20" />
      </div>

      {/* 삭제 (왼쪽) */}
      <div className="relative mt-4">
        <div className="absolute inset-y-0 left-0 flex w-20 items-center justify-center rounded-l-2xl bg-red-500/20">
          <span className="text-xl">🗑</span>
        </div>
        <div
          className="relative z-10 ml-auto w-[85%] rounded-2xl border border-white/15 p-4 shadow-xl"
          style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #3d0c02 50%, #1a0505 100%)", transform: "translateX(-32px)" }}
        >
          <span className="text-[10px] font-bold tracking-[0.1em] text-white/30">영어 회화 마스터</span>
          <p className="mt-0.5 text-[15px] font-bold text-[#FFB5A7]">단어 50개 암기</p>
          <p className="mt-1 font-mono text-[12px] text-white/50">20m 집중</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-red-500/20" />
        <span className="text-[10px] font-bold text-red-400">← 왼쪽 스와이프 = 삭제</span>
        <div className="h-px flex-1 bg-red-500/20" />
      </div>

      {/* 완료 후 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
        <p className="text-[22px]">🎉</p>
        <p className="mt-2 text-sm font-bold text-white/90">오늘도 잘 마무리했어요</p>
        <p className="mt-1 text-[12px] text-white/40">1h 42m 집중했어요 ✨</p>
        <p className="mt-2 text-[10px] text-white/25">집중한 시간은 마스터 카드에 계속 쌓여요</p>
      </div>
    </div>
  );
}

/* ─── 4) 보관함: 골드·실버 컬렉션 ─── */
export function ScreenVault() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* 탭 */}
      <div className="flex gap-2">
        <span className="rounded-xl px-3.5 py-1.5 text-[11px] font-bold text-white/40" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>활성</span>
        <span className="rounded-xl px-3.5 py-1.5 text-[11px] font-bold" style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>골드</span>
        <span className="rounded-xl px-3.5 py-1.5 text-[11px] font-bold text-white/40" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>실버</span>
      </div>

      {/* 골드 마스터 */}
      <div className="relative rounded-2xl border border-amber-500/30 p-5 shadow-[0_0_50px_-12px_rgba(255,215,0,0.25)]" style={{ background: "linear-gradient(145deg, #1a1508 0%, #2d2410 40%, #1a1205 100%)" }}>
        <div className="absolute left-0 right-0 top-0 h-1.5 rounded-t-2xl" style={{ background: GOLD_RIBBON }} />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: "#FFD966", textShadow: "0 0 10px rgba(255,215,0,0.45)" }}>GOLD</span>
            <p className="mt-1 text-[17px] font-bold text-amber-50">영어 회화 마스터</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-amber-950" style={{ background: GOLD_RIBBON }}>소장</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums text-amber-100" style={{ textShadow: "0 2px 8px rgba(255,215,0,0.3)" }}>128h 45m</p>
            <p className="text-[10px] text-amber-200/50">총 집중</p>
          </div>
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))", border: "1px solid rgba(255,215,0,0.25)" }} />
        </div>
        <p className="mt-3 text-[11px] font-semibold text-amber-200/60">목표 달성: 토익 850점</p>
      </div>

      {/* 실버 마스터 */}
      <div className="relative rounded-2xl border border-zinc-500/30 p-5 shadow-lg" style={{ background: "linear-gradient(145deg, #12141a 0%, #1c1f28 45%, #111318 100%)" }}>
        <div className="absolute left-0 right-0 top-0 h-1.5 rounded-t-2xl" style={{ background: SILVER_RIBBON }} />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-400">SILVER</span>
            <p className="mt-1 text-[16px] font-bold text-zinc-100">1일 1드로잉</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-zinc-800" style={{ background: SILVER_RIBBON }}>기록</span>
        </div>
        <div className="mt-3">
          <p className="font-mono text-xl font-bold tabular-nums text-zinc-200">32h 10m</p>
          <p className="text-[10px] text-zinc-500">아쉽지만, 다음 목표의 발판</p>
        </div>
      </div>

      {/* 갤러리 미리보기 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-[11px] font-bold text-white/40">카드 갤러리</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", name: "미드나이트" },
            { bg: "linear-gradient(135deg, #0d1b2a, #1b4332, #1e3a5f)", name: "오로라" },
            { bg: "linear-gradient(135deg, #1a0a0a, #3d0c02, #1a0505)", name: "크림슨" },
          ].map((p) => (
            <div key={p.name} className="aspect-[85.6/54] rounded-xl border border-white/10 p-2 shadow-md" style={{ background: p.bg }}>
              <span className="text-[8px] font-bold text-white/40">{p.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-white/25">모은 카드를 보관함 갤러리에서 감상</p>
      </div>
    </div>
  );
}
