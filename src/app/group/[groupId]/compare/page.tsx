"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { getShortlist, getTradeoffs, type ShortlistEntryDTO } from "@/lib/apiClient";
import type { ListingMatchResult } from "@/lib/matching/listingMatch";

export default function ComparePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <CompareContent groupId={groupId} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

interface Entry {
  shortlist: ShortlistEntryDTO;
  result: ListingMatchResult;
}

function CompareContent({ groupId }: { groupId: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { shortlist } = await getShortlist(groupId);
      const active = shortlist.filter((s) => s.status !== "REMOVED");
      const withResults = await Promise.all(
        active.map(async (s) => {
          const { result } = await getTradeoffs(groupId, s.listing.id);
          return { shortlist: s, result };
        })
      );
      setEntries(withResults);
      setSelected(new Set(withResults.slice(0, 3).map((e) => e.shortlist.listing.id)));
    })();
  }, [groupId]);

  if (entries === null) return <div className="p-8 text-center text-muted">Loading…</div>;

  if (entries.length < 2) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Shortlist a few apartments first</h1>
        <p className="mt-3 text-muted">Compare works once you&apos;ve shortlisted at least 2 apartments.</p>
        <Link
          href={`/group/${groupId}/matches`}
          className="mt-6 inline-block rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
        >
          Go to Group Matches
        </Link>
      </div>
    );
  }

  const compared = entries.filter((e) => selected.has(e.shortlist.listing.id)).slice(0, 5);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-3xl font-extrabold">Group Comparison</h1>
      <p className="mt-1 text-muted">
        We show the trade-offs. You and your friends decide — the app never picks a winner.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {entries.map((e) => (
          <button
            key={e.shortlist.listing.id}
            onClick={() => toggle(e.shortlist.listing.id)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${
              selected.has(e.shortlist.listing.id)
                ? "border-brand bg-brand-soft text-brand"
                : "border-border text-muted hover:border-brand"
            }`}
          >
            {e.shortlist.listing.title}
          </button>
        ))}
      </div>

      {compared.length < 2 ? (
        <p className="mt-8 text-muted">Select at least 2 to compare.</p>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-3xl border border-border bg-card">
            <ComparisonTable entries={compared} />
          </div>

          <div className="mt-10 flex flex-col gap-8">
            <h2 className="text-2xl font-extrabold">Who Gets What?</h2>
            {compared.map((e) => (
              <WhoGetsWhat key={e.shortlist.listing.id} entry={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const ROWS: { label: string; render: (e: Entry) => React.ReactNode }[] = [
  { label: "Rent", render: (e) => `₹${e.shortlist.listing.rent.toLocaleString("en-IN")}` },
  {
    label: "Individual contribution",
    render: (e) => `₹${Math.round(e.shortlist.listing.rent / e.result.perUser.length).toLocaleString("en-IN")}`,
  },
  { label: "Location", render: (e) => e.shortlist.listing.location },
  { label: "Bedrooms", render: (e) => e.shortlist.listing.bedrooms },
  { label: "Bathrooms", render: (e) => e.shortlist.listing.bathrooms },
  { label: "Lift", render: (e) => check(e.shortlist.listing.hasLift) },
  { label: "Parking", render: (e) => check(e.shortlist.listing.parking) },
  { label: "Balcony", render: (e) => check(e.shortlist.listing.balcony) },
  {
    label: "Furnishing",
    render: (e) =>
      e.shortlist.listing.furnished === "furnished"
        ? "Furnished"
        : e.shortlist.listing.furnished === "semi"
          ? "Semi-furnished"
          : "Unfurnished",
  },
  { label: "Pet policy", render: (e) => check(e.shortlist.listing.petFriendly) },
  { label: "Group fit score", render: (e) => `${e.result.groupScore}%` },
  { label: "Shared requirements met", render: (e) => e.result.sharedRequirementCount },
  { label: "Total compromises", render: (e) => e.result.compromiseCount },
];

function ComparisonTable({ entries }: { entries: Entry[] }) {
  return (
    <table className="w-full min-w-[600px] text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="p-4 text-left font-bold text-muted">Apartment</th>
          {entries.map((e) => (
            <th key={e.shortlist.listing.id} className="p-4 text-left font-extrabold">
              {e.shortlist.listing.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.label} className="border-b border-border last:border-0">
            <td className="p-4 font-semibold text-muted">{row.label}</td>
            {entries.map((e) => (
              <td key={e.shortlist.listing.id} className="p-4 font-medium">
                {row.render(e)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function check(v: boolean) {
  return v ? <span className="text-success">✓</span> : <span className="text-danger">✕</span>;
}

function WhoGetsWhat({ entry }: { entry: Entry }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-xl font-extrabold">{entry.shortlist.listing.title}</p>
      <p className="text-sm text-muted">{entry.shortlist.listing.location}</p>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {entry.result.perUser.map((u) => (
          <div key={u.person.userId} className="rounded-2xl bg-muted-bg p-4">
            <p className="font-extrabold">
              {u.person.emoji} {u.person.name}
            </p>

            {u.gets.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-success">Gets</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {u.gets.slice(0, 5).map((g) => (
                    <li key={g.cardId} className="flex gap-1.5">
                      <span className="text-success">✓</span> {g.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {u.compromises.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-warning">Compromises on</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {u.compromises.slice(0, 4).map((c) => (
                    <li key={c.cardId} className="flex gap-1.5">
                      <span className="text-warning">⚠</span> {c.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
