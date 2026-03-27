"use client";

import { Button } from "@/components/ui/button";

function mailtoDraft() {
  const subject = encodeURIComponent("TodoWallet 베타 신청");
  const body = encodeURIComponent(
    "안녕하세요. TodoWallet 베타 참여를 희망합니다.\n\n- 호칭/이름:\n- 사용 환경 (OS, 브라우저):\n- 기대하는 점:\n",
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

function buildMailto(contact: string) {
  const subject = encodeURIComponent("TodoWallet 베타 신청");
  const body = encodeURIComponent(
    "안녕하세요. TodoWallet 베타 참여를 희망합니다.\n\n- 호칭/이름:\n- 사용 환경 (OS, 브라우저):\n- 기대하는 점:\n",
  );
  return `mailto:${contact}?subject=${subject}&body=${body}`;
}

export function BetaSignupCta() {
  const signupUrl = process.env.NEXT_PUBLIC_BETA_SIGNUP_URL?.trim();
  const contactEmail = process.env.NEXT_PUBLIC_BETA_CONTACT_EMAIL?.trim();

  const href =
    signupUrl || (contactEmail ? buildMailto(contactEmail) : mailtoDraft());

  return (
    <Button
      asChild
      size="lg"
      className="h-11 min-w-[200px] bg-rose-500 font-medium text-white shadow-[0_0_40px_-8px_rgba(244,63,94,0.55)] hover:bg-rose-600"
    >
      <a
        href={href}
        target={signupUrl ? "_blank" : undefined}
        rel={signupUrl ? "noopener noreferrer" : undefined}
      >
        베타 신청하기
      </a>
    </Button>
  );
}
