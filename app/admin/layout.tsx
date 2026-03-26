import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TodoWallet Admin",
  description: "TodoWallet 관리자",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased" data-app="admin">
      {children}
    </div>
  );
}
