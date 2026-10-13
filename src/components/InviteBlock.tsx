"use client";

import { useState } from "react";

export function InviteBlock({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/group/${groupId}` : "";
  const whatsappText = encodeURIComponent(
    `Join "${groupName}" on Shared Flat Finder — let's find a flat we can all agree on: ${link}`
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — no-op, link is still visible/selectable
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={copyLink}
        className="flex-1 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold transition hover:border-accent hover:text-accent"
      >
        {copied ? "Copied!" : "Copy invite link"}
      </button>
      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 rounded-2xl bg-[#25D366] px-5 py-3 text-center text-sm font-bold text-white transition hover:brightness-95"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
