"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AuthControls } from "@/components/layout/auth-controls";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/hiring-flow", label: "Hiring flow" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#eef2f8] bg-white text-[#0b1220]">
      <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between gap-4 px-4 sm:h-[68px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#225aea] text-sm font-bold text-white">
            CV
          </span>
          <span className="truncate text-[16px] font-semibold tracking-tight text-[#0b1220] sm:text-[17px]">
            CareerVerse AI
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-[14px] font-medium hover:bg-[#f5f8ff] hover:text-[#0b1220] ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-[#f5f8ff] text-[#0b1220]"
                  : "text-[#475467]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          <AuthControls />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e7ec] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#eef2f8] bg-white px-4 py-4 md:hidden">
          <div className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#f5f8ff]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <AuthControls compact />
        </div>
      ) : null}
    </header>
  );
}
