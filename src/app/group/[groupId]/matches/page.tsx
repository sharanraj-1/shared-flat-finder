"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { ListingCard } from "@/components/ListingCard";
import { getGroupMatches, addToShortlist, type GroupMatchDTO } from "@/lib/apiClient";

export default function MatchesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <MatchesContent groupId={groupId} totalMembers={group.members.length} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function MatchesContent({ groupId, totalMembers }: { groupId: string; totalMembers: number }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<GroupMatchDTO[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    getGroupMatches(groupId).then((res) => {
      setReady(res.ready);
      setMatches(res.matches);
    });
  }, [groupId]);

  async function shortlist(listingId: string) {
    await addToShortlist(groupId, listingId);
    setAdded((prev) => new Set(prev).add(listingId));
  }

  if (ready === null) return <div className="p-8 text-center text-muted">Loading…</div>;

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Not ready yet</h1>
        <p className="mt-3 text-muted">Everyone needs to lock their preferences first.</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">No group matches yet</h1>
        <p className="mt-3 text-muted">
          A listing shows up here once every group member has swiped on it in Apartment Tinder.
        </p>
        <Link
          href={`/group/${groupId}/apartments`}
          className="mt-6 inline-block rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
        >
          Go Swipe Apartments
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-3xl font-extrabold">Group Matches</h1>
      <p className="mt-1 text-muted">The strongest group-compatible listings, ranked by how many of you liked them.</p>

      <div className="mt-6 flex flex-col gap-6">
        {matches.map((m) => (
          <div key={m.listing.id}>
            <ListingCard
              listing={m.listing}
              badge={
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    m.likeCount === m.totalMembers ? "bg-success text-white" : "bg-white/90 text-accent"
                  }`}
                >
                  {m.likeCount}/{m.totalMembers} {m.likeCount === m.totalMembers ? "GROUP MATCH" : "LIKED"}
                </span>
              }
            >
              <div className="flex flex-wrap gap-2">
                {m.reactions.map((r) => (
                  <span
                    key={r.person.userId}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.action === "LIKE" ? "bg-success-soft text-success" : "bg-muted-bg text-muted"
                    }`}
                    title={r.reason ?? undefined}
                  >
                    {r.person.emoji} {r.person.name} {r.action === "LIKE" ? "❤️" : "🤔"}
                  </span>
                ))}
              </div>

              {m.reactions.some((r) => r.action === "PASS" && r.reason) && (
                <div className="rounded-2xl bg-muted-bg p-3 text-sm">
                  {m.reactions
                    .filter((r) => r.action === "PASS" && r.reason)
                    .map((r) => (
                      <p key={r.person.userId} className="text-muted">
                        <span className="font-semibold text-foreground">{r.person.name}</span> passed because:{" "}
                        {r.reason}
                      </p>
                    ))}
                </div>
              )}

              <div className="mt-2 flex gap-3">
                <Link
                  href={`/group/${groupId}/listing/${m.listing.id}`}
                  className="flex-1 rounded-2xl border-2 border-border py-2.5 text-center text-sm font-bold transition hover:border-accent hover:text-accent"
                >
                  Compare Details
                </Link>
                <button
                  onClick={() => shortlist(m.listing.id)}
                  disabled={added.has(m.listing.id)}
                  className="flex-1 rounded-2xl bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
                >
                  {added.has(m.listing.id) ? "Shortlisted ✓" : "Shortlist"}
                </button>
              </div>
            </ListingCard>
          </div>
        ))}
      </div>
    </div>
  );
}
