"use client";

import { useId } from "react";

type BrandLogoProps = {
  className?: string;
  size?: number;
  /** 흰 배경 대비용 (로그인 등) */
  withBackground?: boolean;
};

export function BrandLogo({ className, size = 64, withBackground = true }: BrandLogoProps) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, "");
  const fid = `tw-crisp-${uid}`;

  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="40" stdDeviation="30" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>
      {withBackground ? <rect width="1024" height="1024" fill="#FFFFFF" /> : null}
      <g transform="rotate(-45, 512, 512)">
        <rect x="-102" y="235" width="921" height="553" rx="61" fill="#F43F5E" filter={`url(#${fid})`} />
        <rect x="-102" y="112" width="921" height="553" rx="61" fill="#EC4899" filter={`url(#${fid})`} />
        <rect x="-102" y="-10" width="921" height="553" rx="61" fill="#A855F7" filter={`url(#${fid})`} />
        <rect x="-102" y="-133" width="921" height="553" rx="61" fill="#6366F1" filter={`url(#${fid})`} />
        <g filter={`url(#${fid})`}>
          <rect x="-102" y="-256" width="921" height="553" rx="61" fill="#2563EB" />
          <rect x="20" y="-153" width="122" height="92" rx="20" fill="#FACC15" />
          <line x1="20" y1="-107" x2="142" y2="-107" stroke="#CA8A04" strokeWidth="5" />
          <text
            x="368"
            y="163"
            fill="#FFFFFF"
            fontSize="163"
            style={{
              letterSpacing: "-3px",
              fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
            }}
          >
            todo
          </text>
        </g>
      </g>
    </svg>
  );
}
