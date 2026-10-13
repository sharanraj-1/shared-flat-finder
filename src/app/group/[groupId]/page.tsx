"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { InviteBlock } from "@/components/InviteBlock";
import { MemberProgress } from "@/components/MemberProgress";
import { getGroupDna, type GroupInfo } from "@/lib/apiClient";

export default function GroupHubPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);

  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group, refreshGroup }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <HubContent groupId={groupId} identity={identity} group={group} refreshGroup={refreshGroup} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function HubContent({
  groupId,
  identity,
  group,
  refreshGroup,
}: {
  groupId: string;
  identity: { userId: string; name: string };
  group: GroupInfo;
  refreshGroup: () => void;
}) {
  const [allReady, setAllReady] = useState(false);

  useEffect(() => {
    getGroupDna(groupId).then((r) => setAllReady(r.ready));
    refreshGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const me = group.members.find((m) => m.userId === identity.userId);
  const myStatus = me?.status ?? "PENDING";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">{group.city}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{group.name}</h1>
      {group.moveInDate && <p className="mt-1 text-muted">Moving in {group.moveInDate}</p>}

      {myStatus === "PENDING" && (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-brand to-accent p-6 text-brand-foreground shadow-lg">
          <p className="text-lg font-extrabold">Complete your preferences</p>
          <p className="mt-1 text-sm opacity-90">
            Swipe through what matters to you before seeing anyone else&apos;s answers.
          </p>
          <Link
            href={`/group/${groupId}/preferences`}
            className="mt-4 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-accent"
          >
            Start Preference Tinder
          </Link>
        </div>
      )}

      {myStatus === "COMPLETE" && !allReady && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <p className="text-lg font-extrabold">Waiting for friends</p>
          <p className="mt-1 text-sm text-muted">
            Waiting for {group.members.filter((m) => m.status !== "COMPLETE").map((m) => m.name).join(" and ")} to
            finish their preferences.
          </p>
        </div>
      )}

      {allReady && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/group/${groupId}/dna`}
            className="rounded-3xl bg-gradient-to-br from-brand to-accent p-6 text-brand-foreground shadow-lg transition hover:brightness-105"
          >
            <p className="text-lg font-extrabold">Group Home DNA</p>
            <p className="mt-1 text-sm opacity-90">See where you agree — and where you don&apos;t.</p>
          </Link>
          <Link
            href={`/group/${groupId}/apartments`}
            className="rounded-3xl border border-border bg-card p-6 transition hover:border-brand"
          >
            <p className="text-lg font-extrabold">Swipe Apartments</p>
            <p className="mt-1 text-sm text-muted">Like or pass on matched listings.</p>
          </Link>
        </div>
      )}

      <div className="mt-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Member status</p>
        <MemberProgress members={group.members} />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Invite more friends</p>
        <InviteBlock groupId={groupId} groupName={group.name} />
      </div>
    </div>
  );
}
