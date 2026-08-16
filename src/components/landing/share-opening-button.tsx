"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareOpeningButton({ title, company }: { title: string; company: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `${title} at ${company}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Closing the native share sheet is not an application error.
      if ((error as DOMException).name !== "AbortError") {
        setCopied(false);
      }
    }
  }

  return (
    <button
      type="button"
      className="cv-od-share"
      aria-label={`Share ${title} at ${company}`}
      onClick={() => void share()}
    >
      {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
