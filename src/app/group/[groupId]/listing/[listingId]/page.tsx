"use client";

import { use, useEffect, useState } from "react";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { ListingCard } from "@/components/ListingCard";
import {
  getTradeoffs,
  getDiscussion,
  postDiscussionMessage,
  addToShortlist,
  type DiscussionMessageDTO,
} from "@/lib/apiClient";
import type { ListingMatchResult } from "@/lib/matching/listingMatch";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; listingId: string }>;
}) {
  const { groupId, listingId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <ListingDetail groupId={groupId} listingId={listingId} userId={identity.userId} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function ListingDetail({ groupId, listingId, userId }: { groupId: string; listingId: string; userId: string }) {
  const [result, setResult] = useState<ListingMatchResult | null>(null);
  const [reactions, setReactions] = useState<
    { person: { userId: string; name: string; emoji: string }; action: "LIKE" | "PASS" | null; reason: string | null }[]
  >([]);
  const [messages, setMessages] = useState<DiscussionMessageDTO[]>([]);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<"CONCERN" | "ACCEPTABLE" | null>(null);
  const [shortlisted, setShortlisted] = useState(false);

  async function load() {
    const [t, d] = await Promise.all([getTradeoffs(groupId, listingId), getDiscussion(groupId, listingId)]);
    setResult(t.result);
    setReactions(t.reactions);
    setMessages(d.messages);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, listingId]);

  async function send() {
    if (!draft.trim()) return;
    const msg = await postDiscussionMessage(groupId, { userId, listingId, message: draft.trim(), tag });
    setMessages((prev) => [...prev, msg]);
    setDraft("");
    setTag(null);
  }

  async function shortlist() {
    await addToShortlist(groupId, listingId);
    setShortlisted(true);
  }

  if (!result) return <div className="p-8 text-center text-muted">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <ListingCard
        listing={result.listing}
        badge={
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-accent">
            {result.groupScore}% group fit
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {reactions.map((r) => (
            <span
              key={r.person.userId}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                r.action === "LIKE" ? "bg-success-soft text-success" : "bg-muted-bg text-muted"
              }`}
            >
              {r.person.emoji} {r.person.name} {r.action === "LIKE" ? "❤️" : r.action === "PASS" ? "🤔" : "…"}
            </span>
          ))}
        </div>
        <button
          onClick={shortlist}
          disabled={shortlisted}
          className="rounded-2xl bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
        >
          {shortlisted ? "Shortlisted ✓" : "Add to Shortlist"}
        </button>
      </ListingCard>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {result.perUser.map((u) => (
          <div key={u.person.userId} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-extrabold">
              {u.person.emoji} {u.person.name}
            </p>
            <div className="mt-2">
              <p className="text-xs font-bold uppercase text-success">Gets</p>
              <ul className="mt-1 text-sm">
                {u.gets.slice(0, 4).map((g) => (
                  <li key={g.cardId}>✓ {g.label}</li>
                ))}
              </ul>
            </div>
            {u.compromises.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold uppercase text-warning">Compromises on</p>
                <ul className="mt-1 text-sm">
                  {u.compromises.slice(0, 3).map((c) => (
                    <li key={c.cardId}>⚠ {c.note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold">Discuss &amp; Negotiate</h2>
        <div className="mt-4 flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-bold">
                {m.person.emoji} {m.person.name}
                {m.tag && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      m.tag === "CONCERN" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
                    }`}
                  >
                    {m.tag === "CONCERN" ? "Concern" : "Acceptable"}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-foreground/90">{m.message}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-muted">No messages yet — start the conversation.</p>}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share a thought…"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setTag(tag === "CONCERN" ? null : "CONCERN")}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  tag === "CONCERN" ? "border-danger bg-danger-soft text-danger" : "border-border text-muted"
                }`}
              >
                Mark as concern
              </button>
              <button
                onClick={() => setTag(tag === "ACCEPTABLE" ? null : "ACCEPTABLE")}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  tag === "ACCEPTABLE" ? "border-success bg-success-soft text-success" : "border-border text-muted"
                }`}
              >
                Mark as acceptable
              </button>
            </div>
            <button onClick={send} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-foreground">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
