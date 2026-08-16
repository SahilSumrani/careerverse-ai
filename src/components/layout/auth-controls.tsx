"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOutEverywhere } from "@/lib/firebase-auth-client";
import { useState } from "react";

type AuthControlsProps = {
  compact?: boolean;
};

/** Header auth: links only — Google lives on /auth/signin and /auth/signup */
export function AuthControls({ compact }: AuthControlsProps) {
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    await signOutEverywhere();
  }

  if (status === "loading") {
    return (
      <span className="inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-xl bg-[#f3f3f3] px-3 text-sm text-[#667085]">
        …
      </span>
    );
  }

  if (session?.user) {
    const label = session.user.name?.split(" ")[0] || session.user.email?.split("@")[0] || "Account";
    return (
      <div className={`flex items-center gap-2 ${compact ? "w-full flex-col" : ""}`}>
        <Link
          href="/dashboard"
          className={`inline-flex h-10 items-center gap-2 rounded-xl border border-[#e4e7ec] px-3 text-sm font-medium text-[#0b1220] hover:bg-[#f5f8ff] ${compact ? "w-full justify-center" : ""}`}
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#225aea] text-[10px] font-bold text-white">
              {label.slice(0, 1).toUpperCase()}
            </span>
          )}
          {label}
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSignOut()}
          className={`inline-flex h-10 items-center justify-center rounded-xl bg-[#f3f3f3] px-3 text-sm font-medium text-[#1f1f1f] hover:bg-[#e8e8e8] disabled:opacity-60 ${compact ? "w-full" : ""}`}
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/auth/signin"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e4e7ec] text-sm font-semibold"
        >
          Sign in
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#225aea] text-sm font-semibold text-white"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link href="/auth/signin" className="cv-btn-wrap is-secondary">
        <span className="cv-btn">Sign in</span>
      </Link>
      <Link href="/auth/register" className="cv-btn-wrap">
        <span className="cv-btn">Sign up</span>
      </Link>
    </div>
  );
}
