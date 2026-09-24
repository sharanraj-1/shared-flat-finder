"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { DnaBarRow } from "@/components/DnaBarRow";
import { getGroupDna } from "@/lib/apiClient";
import type { GroupHomeDna } from "@/lib/matching/groupDna";

export default function DnaPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <DnaContent groupId={groupId} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function DnaContent({ groupId }: { groupId: string }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [waitingOn, setWaitingOn] = useState<string[]>([]);
  const [dna, setDna] = useState<GroupHomeDna | null>(null);

  useEffect(() => {
    getGroupDna(groupId).then((res) => {
      setReady(res.ready);
      if (res.ready && res.dna) setDna(res.dna);
      if (!res.ready && res.waitingOn) setWaitingOn(res.waitingOn);
    });
  }, [groupId]);

  if (ready === null) return <div className="p-8 text-center text-muted">Loading…</div>;

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Group Home DNA</h1>
        <p className="mt-3 text-muted">
          Waiting for {waitingOn.join(" and ")} to finish {waitingOn.length === 1 ? "their" : "their"} preferences.
        </p>
      </div>
    );
  }

  if (!dna) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-3xl font-extrabold">Group Home DNA</h1>
      <p className="mt-1 text-muted">Your combined search profile — where you agree, and where you don&apos;t.</p>

      {dna.budget && (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-brand to-accent p-6 text-brand-foreground shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wide opacity-90">Group Budget Ceiling</p>
          <p className="mt-1 text-3xl font-extrabold">₹{dna.budget.groupMax.toLocaleString("en-IN")}/person</p>
          <p className="mt-1 text-sm opacity-90">
            Comfortable up to ₹{dna.budget.groupComfortable.toLocaleString("en-IN")} — the tightest budget in the
            group sets the ceiling everyone fits under.
          </p>
        </div>
      )}

      <Section title="Shared Priorities" subtitle="Things everyone wants">
        {dna.shared.length === 0 && <Empty />}
        {dna.shared.map((b) => (
          <DnaBarRow key={b.cardId} bar={b} />
        ))}
      </Section>

      <Section title="Flexible Preferences" subtitle="Things most people want">
        {dna.flexible.length === 0 && <Empty />}
        {dna.flexible.map((b) => (
          <DnaBarRow key={b.cardId} bar={b} />
        ))}
      </Section>

      <Section title="Conflicts" subtitle="Where preferences differ significantly">
        {dna.conflicts.length === 0 && dna.locationConflict.hasConflict === false && <Empty />}
        {dna.conflicts.map((b) => (
          <DnaBarRow key={b.cardId} bar={b} />
        ))}
      </Section>

      {dna.locationConflict.hasConflict && (
        <div className="mt-6 rounded-3xl border-2 border-danger/30 bg-danger-soft p-6">
          <p className="text-sm font-extrabold uppercase tracking-wide text-danger">Biggest Group Conflict</p>
          <p className="mt-1 text-xl font-extrabold">Location</p>
          <p className="mt-2 text-sm text-foreground/80">
            Your location preferences are different. We&apos;ll prioritize listings that create the smallest overall
            compromise.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dna.locationConflict.perPerson.map((p) => (
              <span
                key={p.person.userId}
                className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-sm"
              >
                {p.person.emoji} {p.person.name}: {p.topArea ?? "No strong pick"}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/group/${groupId}/apartments`}
        className="mt-10 block rounded-2xl bg-brand py-3.5 text-center text-base font-bold text-brand-foreground shadow-lg shadow-brand/25"
      >
        See Matched Apartments
      </Link>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mb-3 text-sm text-muted">{subtitle}</p>
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted">Nothing here.</p>;
}
