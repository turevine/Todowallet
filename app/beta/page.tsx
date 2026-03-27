import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { BetaSignupCta } from "./beta-signup-cta";
import {
  PhoneFrame,
  ScreenHome,
  ScreenTimer,
  ScreenSwipeComplete,
  ScreenVault,
} from "./beta-mockups";

const GOLD_RIBBON =
  "linear-gradient(90deg, #8B6914 0%, #D4AF37 18%, #FFD700 38%, #FFF4B8 50%, #FFD700 62%, #C5A028 82%, #7A5C0C 100%)";
const SILVER_RIBBON =
  "linear-gradient(90deg, #4B5563 0%, #9CA3AF 22%, #E8EAEF 48%, #F9FAFB 52%, #C4C8D0 72%, #6B7280 100%)";

export default function BetaLandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fffbf7] text-zinc-900 selection:bg-rose-200">
      {/* BG decorations */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(251,113,133,0.22),transparent),radial-gradient(ellipse_60%_50%_at_100%_20%,rgba(253,230,138,0.4),transparent),radial-gradient(ellipse_50%_40%_at_0%_70%,rgba(254,215,170,0.3),transparent)]" aria-hidden />

      {/* ═══ HEADER ═══ */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <BrandLogo size={48} withBackground />
          <span className="font-[family-name:var(--font-poppins)] text-xl font-bold tracking-tight text-zinc-900">TodoWallet</span>
        </Link>
        <Button asChild variant="outline" size="sm" className="border-rose-200 bg-white/90 text-zinc-800 shadow-sm hover:bg-rose-50">
          <Link href="/">앱 열기</Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">

        {/* ═══ HERO ═══ */}
        <section className="pb-20 pt-8 text-center sm:pt-16 sm:pb-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-4 py-1.5 text-sm font-semibold text-rose-600 shadow-sm">
            <Sparkles className="size-4 shrink-0 text-rose-500" aria-hidden />
            베타 테스터 모집
          </p>
          <h1 className="mx-auto max-w-4xl font-[family-name:var(--font-poppins)] text-4xl font-extrabold leading-[1.15] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
            목표를 끝까지 이루고,
            <br />
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">카드로 영원히 남기세요</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            TodoWallet은 &ldquo;체크 많이 하기&rdquo;가 아니라{" "}
            <strong className="font-semibold text-zinc-800">단·장기 목표를 이뤄 내는 것</strong>에 집중해요.
            <br className="hidden sm:block" />
            한 일이 사라지지 않는 건 그 위에 쌓이는 부수적인 가치이고, 핵심은 목표 달성입니다.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BetaSignupCta />
            <Button asChild variant="ghost" size="lg" className="text-zinc-600 hover:bg-rose-50 hover:text-zinc-900">
              <Link href="/" className="gap-2">
                먼저 둘러보기
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        {/* ═══ FEATURE 1 — 홈 화면 ═══ */}
        <section className="relative mb-32">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-rose-500">Home</p>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-extrabold text-zinc-900 sm:text-4xl">
              목표가 중심인 홈 화면
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              마스터 카드가 장기 목표의 축이 되고, 그 아래 오늘의 카드가 겹겹이 쌓여요.
              <br className="hidden sm:block" />
              주간 히트맵과 목표 D-day 배너로 리듬과 방향이 한눈에 보입니다.
            </p>
          </div>
          <div className="relative mx-auto max-w-md">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-rose-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 size-56 rounded-full bg-amber-300/15 blur-3xl" />
            <PhoneFrame>
              <ScreenHome />
            </PhoneFrame>
          </div>
        </section>

        {/* ═══ FEATURE 2 — 집중 · 타이머 ═══ */}
        <section className="relative mb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-600">Focus</p>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-extrabold text-zinc-900 sm:text-4xl">
                탭 한 번으로 집중 시작,
                <br />시간이 카드에 쌓여요
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                카드를 탭하면 <strong className="text-zinc-800">타이머가 바로 돌아가요.</strong> 집중·일시정지·휴식이 모두 기록되고,
                체크리스트로 세부 할 일도 관리할 수 있어요.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "실시간 타이머 — 집중 시간이 카드에 바로 반영",
                  "체크리스트 — 카드 안에서 세부 할 일 체크",
                  "휴식 타이머 — 쉬는 것까지 기록으로 남겨요",
                  "세션 시각화 — 오늘 집중·휴식 흐름을 한눈에",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-zinc-700">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
              <PhoneFrame>
                <ScreenTimer />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* ═══ FEATURE 3 — 스와이프 완료 ═══ */}
        <section className="relative mb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative">
              <div className="pointer-events-none absolute -left-12 -top-12 size-64 rounded-full bg-pink-400/10 blur-3xl" />
              <PhoneFrame>
                <ScreenSwipeComplete />
              </PhoneFrame>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-pink-600">Swipe</p>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-extrabold text-zinc-900 sm:text-4xl">
                스와이프 한 번에
                <br />오늘이 마무리돼요
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                카드를 <strong className="text-zinc-800">오른쪽</strong>으로 밀면 완료, <strong className="text-zinc-800">왼쪽</strong>으로 밀면 삭제.
                <br />
                완료해도 그동안 쌓인 <strong className="text-zinc-800">집중 시간은 마스터 카드에 계속 남아</strong> 성취의 근거가 됩니다.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-2xl">→</p>
                  <p className="mt-1 text-sm font-bold text-emerald-800">완료</p>
                  <p className="mt-0.5 text-[11px] text-emerald-700/70">시간 보존</p>
                </div>
                <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-2xl">←</p>
                  <p className="mt-1 text-sm font-bold text-red-800">삭제</p>
                  <p className="mt-0.5 text-[11px] text-red-700/70">되돌리기 가능</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURE 4 — 보관함 · 골드 / 실버 ═══ */}
        <section className="relative mb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-600">Vault</p>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-extrabold text-zinc-900 sm:text-4xl">
                골드로 영원히 소장,
                <br />실버로 다시 도약
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                목표를 이뤄 내면 <strong className="text-zinc-800">골드 카드로 영원히 컬렉션에 남아요.</strong>
                <br />이번에는 아쉽게 끝나도 <strong className="text-zinc-800">실버로 기록</strong>되어, 다음 목표를 세우고 넘어설 발판이 됩니다.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/80 p-5">
                  <div className="absolute left-0 right-0 top-0 h-1.5" style={{ background: GOLD_RIBBON }} />
                  <p className="mt-1 text-3xl">🏆</p>
                  <p className="mt-2 font-[family-name:var(--font-poppins)] text-lg font-bold text-amber-950">골드</p>
                  <p className="mt-1 text-sm text-amber-900/70">목표 달성 → 영원히 소장</p>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-5">
                  <div className="absolute left-0 right-0 top-0 h-1.5" style={{ background: SILVER_RIBBON }} />
                  <p className="mt-1 text-3xl">🪨</p>
                  <p className="mt-2 font-[family-name:var(--font-poppins)] text-lg font-bold text-zinc-800">실버</p>
                  <p className="mt-1 text-sm text-zinc-600">아쉽게 끝남 → 발판으로</p>
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="pointer-events-none absolute -right-16 -bottom-16 size-72 rounded-full bg-amber-400/10 blur-3xl" />
              <PhoneFrame>
                <ScreenVault />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="relative overflow-hidden rounded-[2rem] border border-rose-200 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/40 px-8 py-16 text-center shadow-lg sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-rose-200/30 blur-3xl" aria-hidden />
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-extrabold text-zinc-900 sm:text-4xl">
            함께 만들어 갈 베타에
            <br />참여해 주세요
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            사용하면서 느낀 점, 불편한 점, 기대하는 기능을 알려 주시면
            <br className="hidden sm:block" />
            더 단단한 제품으로 다듬는 데 큰 힘이 됩니다.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BetaSignupCta />
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="mt-16 border-t border-rose-100/80 pt-8 text-center text-sm text-zinc-500">
          <Link href="/" className="font-medium text-zinc-600 underline-offset-4 hover:text-rose-600 hover:underline">
            TodoWallet 홈으로
          </Link>
        </footer>
      </main>
    </div>
  );
}
