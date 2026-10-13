"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { ListingCard } from "@/components/ListingCard";
import { getShortlist, getTradeoffs, updateShortlistStatus, type ShortlistEntryDTO } from "@/lib/apiClient";

export default function ShortlistPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <ShortlistContent groupId={groupId} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function ShortlistContent({ groupId }: { groupId: string }) {
  const [entries, setEntries] = useState<ShortlistEntryDTO[] | null>(null);
  const [reasons, setReasons] = useState<Record<string, string[]>>({});
  const [likedBy, setLikedBy] = useState<Record<string, string[]>>({});

  async function load() {
    const { shortlist } = await getShortlist(groupId);
    setEntries(shortlist);

    const reasonMap: Record<string, string[]> = {};
    const likedMap: Record<string, string[]> = {};
    await Promise.all(
      shortlist.map(async (s) => {
        const { result, reactions } = await getTradeoffs(groupId, s.listing.id);
        const allGetLabels = result.perUser.flatMap((u) => u.gets.map((g) => g.label));
        reasonMap[s.listing.id] = Array.from(new Set(allGetLabels)).slice(0, 4);
        likedMap[s.listing.id] = reactions.filter((r) => r.action === "LIKE").map((r) => r.person.name);
      })
    );
    setReasons(reasonMap);
    setLikedBy(likedMap);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function setStatus(listingId: string, status: "SHORTLISTED" | "VISIT_SCHEDULED" | "REMOVED") {
    await updateShortlistStatus(groupId, listingId, status);
    load();
  }

  if (entries === null) return <div className="p-8 text-center text-muted">Loading…</div>;

  const active = entries.filter((e) => e.status !== "REMOVED");

  if (active.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Nothing shortlisted yet</h1>
        <p className="mt-3 text-muted">Add apartments from Group Matches or Compare.</p>
        <Link
          href={`/group/${groupId}/matches`}
          className="mt-6 inline-block rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
        >
          Go to Group Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-3xl font-extrabold">Final Shortlist</h1>
      <p className="mt-1 text-muted">Pick your finalists — the group makes the final call.</p>

      <div className="mt-6 flex flex-col gap-6">
        {active.map((e) => (
          <ListingCard
            key={e.id}
            listing={e.listing}
            badge={
              e.status === "VISIT_SCHEDULED" ? (
                <span className="rounded-full bg-success px-3 py-1 text-xs font-extrabold text-white">
                  Visit Scheduled
                </span>
              ) : undefined
            }
          >
            {likedBy[e.listing.id]?.length > 0 && (
              <p className="text-sm text-muted">
                Liked by <span className="font-semibold text-foreground">{likedBy[e.listing.id].join(", ")}</span>
              </p>
            )}
            {reasons[e.listing.id]?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-success">Why it matched</p>
                <ul className="mt-1 text-sm text-muted">
                  {reasons[e.listing.id].map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setStatus(e.listing.id, "VISIT_SCHEDULED")}
                className="flex-1 rounded-2xl bg-brand py-2.5 text-sm font-bold text-brand-foreground"
              >
                Schedule Visit
              </button>
              <Link
                href={`/group/${groupId}/compare`}
                className="flex-1 rounded-2xl border-2 border-border py-2.5 text-center text-sm font-bold hover:border-accent hover:text-accent"
              >
                Keep Comparing
              </Link>
              <button
                onClick={() => setStatus(e.listing.id, "REMOVED")}
                className="rounded-2xl border-2 border-border px-4 py-2.5 text-sm font-bold text-muted hover:border-danger hover:text-danger"
              >
                Remove
              </button>
            </div>
          </ListingCard>
        ))}
      </div>
    </div>
  );
}
