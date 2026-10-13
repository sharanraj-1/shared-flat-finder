"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { SwipeStack } from "@/components/SwipeStack";
import { ListingCard } from "@/components/ListingCard";
import { getGroupListings, getMySwipes, recordSwipe } from "@/lib/apiClient";
import type { ListingMatchResult } from "@/lib/matching/listingMatch";

export default function ApartmentTinderPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <ApartmentTinder groupId={groupId} userId={identity.userId} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function ApartmentTinder({ groupId, userId }: { groupId: string; userId: string }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [results, setResults] = useState<ListingMatchResult[]>([]);
  const [remaining, setRemaining] = useState<ListingMatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [listingsRes, swipesRes] = await Promise.all([getGroupListings(groupId), getMySwipes(groupId, userId)]);
      setReady(listingsRes.ready);
      setResults(listingsRes.results);
      const swipedIds = new Set(swipesRes.swipes.map((s) => s.listingId));
      setRemaining(listingsRes.results.filter((r) => !swipedIds.has(r.listing.id)));
      setLoading(false);
    })();
  }, [groupId, userId]);

  async function commit(item: ListingMatchResult, direction: "left" | "right") {
    setRemaining((prev) => prev.filter((r) => r.listing.id !== item.listing.id));
    await recordSwipe(groupId, { userId, listingId: item.listing.id, action: direction === "right" ? "LIKE" : "PASS" });
  }

  const totalSwiped = useMemo(() => results.length - remaining.length, [results, remaining]);

  if (loading || ready === null) return <div className="p-8 text-center text-muted">Loading matched listings…</div>;

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Not ready yet</h1>
        <p className="mt-3 text-muted">Everyone needs to lock their preferences before apartment matching starts.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">We couldn&apos;t find a strong group match</h1>
        <p className="mt-3 text-muted">Every demo listing violates at least one person&apos;s dealbreaker.</p>
        <p className="mt-1 text-sm text-muted">Your biggest constraint is likely budget or a hard requirement.</p>
        <Link
          href={`/group/${groupId}/preferences?edit=budget`}
          className="mt-6 inline-block rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
        >
          Relax a Preference
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-6">
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs font-bold text-muted">
          <span>Apartment Tinder</span>
          <span>
            {totalSwiped} / {results.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
            style={{ width: `${(totalSwiped / Math.max(results.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative" style={{ height: 560 }}>
        <SwipeStack
          items={remaining}
          keyExtractor={(r) => r.listing.id}
          dragLabels={{ left: "PASS", right: "LIKE" }}
          renderCard={(r, commitFn) => (
            <ListingCard
              listing={r.listing}
              badge={
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-accent">
                  {r.groupScore}% group fit
                </span>
              }
            >
              <div className="mt-auto flex gap-3 pt-2">
                <button
                  onClick={() => commitFn("left", 1)}
                  className="flex-1 rounded-2xl border-2 border-border py-3 text-lg font-bold text-muted transition hover:border-danger hover:text-danger"
                >
                  ❌ Pass
                </button>
                <button
                  onClick={() => commitFn("right", 1)}
                  className="flex-1 rounded-2xl bg-brand py-3 text-lg font-bold text-brand-foreground"
                >
                  ❤️ Like
                </button>
              </div>
            </ListingCard>
          )}
          onCommit={(item, direction) => commit(item, direction)}
          emptyState={
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-2xl font-extrabold">You&apos;re through them all!</p>
              <p className="mt-2 text-muted">See how everyone&apos;s picks overlap.</p>
              <Link
                href={`/group/${groupId}/matches`}
                className="mt-6 rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground"
              >
                View Group Matches
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
