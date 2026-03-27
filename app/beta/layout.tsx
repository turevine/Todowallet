import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "베타 테스터 모집 — TodoWallet",
  description:
    "단기·장기 목표를 끝까지 이루는 습관. 카드로 남는 시간과 성취, TodoWallet 베타에 함께해 주세요.",
  openGraph: {
    title: "TodoWallet 베타 테스터 모집",
    description: "목표가 중심이 되는 할 일 앱. 지금 베타에 참여해 보세요.",
  },
};

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
