"use client";

import { use } from "react";
import Link from "next/link";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { InviteBlock } from "@/components/InviteBlock";
import { MemberProgress } from "@/components/MemberProgress";

export default function InvitePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);

  return (
    <GroupIdentityGate groupId={groupId}>
      {({ group }) => (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
          <h1 className="text-3xl font-extrabold">Your group is ready.</h1>
          <p className="mt-2 text-muted">
            Invite your friends. Everyone completes their preferences independently.
          </p>

          <div className="mt-8">
            <InviteBlock groupId={groupId} groupName={group.name} />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Member status</p>
            <MemberProgress members={group.members} />
          </div>

          <Link
            href={`/group/${groupId}`}
            className="mt-8 rounded-2xl bg-brand py-3.5 text-center text-base font-bold text-brand-foreground shadow-lg shadow-brand/25 transition hover:brightness-105"
          >
            Continue to Group
          </Link>
        </div>
      )}
    </GroupIdentityGate>
  );
}
