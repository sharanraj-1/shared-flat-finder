"use client";

import { useEffect, useState } from "react";
import { getGroup, joinGroup, type GroupInfo } from "@/lib/apiClient";
import { getIdentity, setIdentity, type Identity } from "@/lib/session";

interface Props {
  groupId: string;
  children: (ctx: { identity: Identity; group: GroupInfo; refreshGroup: () => void }) => React.ReactNode;
}

export function GroupIdentityGate({ groupId, children }: Props) {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [identity, setIdentityState] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);

  async function load() {
    try {
      const g = await getGroup(groupId);
      setGroup(g);
      const stored = getIdentity(groupId);
      if (stored && g.members.some((m) => m.userId === stored.userId)) {
        setIdentityState(stored);
      } else {
        setIdentityState(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this group.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function continueAs(member: { userId: string; name: string; emoji: string }) {
    const id = { userId: member.userId, name: member.name, emoji: member.emoji };
    setIdentity(groupId, id);
    setIdentityState(id);
  }

  async function joinAsNew() {
    if (!name.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const res = await joinGroup(groupId, name.trim());
      const id = { userId: res.userId, name: res.name, emoji: res.emoji };
      setIdentity(groupId, id);
      setIdentityState(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't join this group.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted">Loading group…</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">{error}</p>
          <p className="mt-2 text-sm text-muted">Double-check the invite link.</p>
        </div>
      </div>
    );
  }

  if (!group) return null;

  if (!identity) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{group.name}</p>
          <h1 className="mt-2 text-2xl font-extrabold">Who are you?</h1>
          <p className="mt-2 text-sm text-muted">
            Everyone completes their preferences independently — pick your name, or join as someone new.
          </p>
        </div>

        {group.members.length > 0 && (
          <div className="flex flex-col gap-2">
            {group.members.map((m) => (
              <button
                key={m.userId}
                onClick={() => continueAs(m)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-brand hover:shadow-md"
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="flex-1 font-semibold">Continue as {m.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.status === "COMPLETE" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                  }`}
                >
                  {m.status === "COMPLETE" ? "Complete" : "Pending"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="mb-2 text-sm font-semibold">Join as someone new</p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              onKeyDown={(e) => e.key === "Enter" && joinAsNew()}
            />
            <button
              onClick={joinAsNew}
              disabled={joining || !name.trim()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </div>
    );
  }

  return <>{children({ identity, group, refreshGroup: load })}</>;
}
