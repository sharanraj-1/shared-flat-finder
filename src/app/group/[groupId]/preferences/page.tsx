"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GroupIdentityGate } from "@/components/GroupIdentityGate";
import { NavShell } from "@/components/NavShell";
import { SwipeStack, type SwipeDirection } from "@/components/SwipeStack";
import { PreferenceCardBody, dragParamsToPriority } from "@/components/preferences/PreferenceCardBody";
import { ProfileSummaryView } from "@/components/preferences/ProfileSummaryView";
import { buildPreferenceDeck, type PreferenceCard } from "@/lib/preferenceDeck";
import { buildProfileSummary } from "@/lib/profileSummary";
import { getPreferences, savePreference, lockPreferences, type StoredPreferenceDTO } from "@/lib/apiClient";
import type { GroupInfo } from "@/lib/apiClient";

export default function PreferencesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);

  return (
    <GroupIdentityGate groupId={groupId}>
      {({ identity, group, refreshGroup }) => (
        <NavShell groupId={groupId} identity={identity} groupName={group.name}>
          <PreferencesFlow groupId={groupId} userId={identity.userId} group={group} refreshGroup={refreshGroup} />
        </NavShell>
      )}
    </GroupIdentityGate>
  );
}

function PreferencesFlow({
  groupId,
  userId,
  group,
  refreshGroup,
}: {
  groupId: string;
  userId: string;
  group: GroupInfo;
  refreshGroup: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCardId = searchParams.get("edit");

  const deck = useMemo(() => buildPreferenceDeck(group.city), [group.city]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [preferences, setPreferences] = useState<StoredPreferenceDTO[]>([]);
  const [remaining, setRemaining] = useState<PreferenceCard[]>([]);
  const [justUpdated, setJustUpdated] = useState(false);
  const pendingValues = useRef<Record<string, unknown>>({});

  async function load() {
    setLoading(true);
    const res = await getPreferences(groupId, userId);
    setLocked(res.locked);
    setPreferences(res.preferences);
    const answeredIds = new Set(res.preferences.map((p) => p.requirement));
    setRemaining(deck.filter((c) => !answeredIds.has(c.id)));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userId]);

  async function saveAnswer(card: PreferenceCard, direction: SwipeDirection, intensity: number) {
    const value = pendingValues.current[card.id];
    delete pendingValues.current[card.id];

    let priority: "DEALBREAKER" | "MUST_HAVE" | "PREFER" | "NICE";
    if (card.kind === "budget") priority = "MUST_HAVE";
    else if (card.kind === "commute") priority = card.mode === "max" ? "MUST_HAVE" : "PREFER";
    else priority = dragParamsToPriority(direction, intensity);

    const res = await savePreference(groupId, {
      userId,
      category: card.category,
      requirement: card.id,
      priority,
      value,
    });

    setPreferences((prev) => [
      ...prev.filter((p) => p.requirement !== card.id),
      { requirement: card.id, category: card.category, priority, value: value ?? null },
    ]);

    if (res.wasLocked) {
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 3000);
    }
  }

  async function handleLock() {
    await lockPreferences(groupId, userId);
    setLocked(true);
    refreshGroup();
  }

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading your preferences…</div>;
  }

  // Single-card edit mode (explicit update to an already-locked preference)
  if (editCardId) {
    const card = deck.find((c) => c.id === editCardId);
    if (!card) return null;
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <button onClick={() => router.back()} className="mb-4 text-sm font-semibold text-muted hover:text-brand">
          ← Cancel
        </button>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-brand">Update a preference</p>
        <div className="relative" style={{ height: 420 }}>
          <SwipeStack
            items={[card]}
            keyExtractor={(c) => c.id}
            isDraggable={(c) => c.kind === "priority" || c.kind === "location"}
            renderCard={(c, commit) => (
              <PreferenceCardBody
                card={c}
                index={0}
                total={1}
                commit={commit}
                onValueChange={(v) => (pendingValues.current[c.id] = v)}
              />
            )}
            onCommit={async (c, direction, intensity) => {
              await saveAnswer(c, direction, intensity);
              router.push(`/group/${groupId}/preferences`);
            }}
            emptyState={<p className="text-center text-muted">Updated.</p>}
          />
        </div>
      </div>
    );
  }

  const summary = buildProfileSummary(deck, preferences);
  const doneSwiping = remaining.length === 0;

  if (locked) {
    return (
      <div className="mx-auto max-w-lg px-5 py-8">
        <h1 className="text-2xl font-extrabold">Your Home Profile</h1>
        <p className="mt-1 text-sm text-muted">Locked — changes need an explicit update.</p>
        {justUpdated && (
          <div className="mt-4 rounded-xl bg-success-soft px-4 py-2 text-sm font-semibold text-success">
            Preference updated.
          </div>
        )}
        <div className="mt-6">
          <ProfileSummaryView summary={summary} onEditCard={(cardId) => router.push(`?edit=${cardId}`)} />
        </div>
        <p className="mt-6 text-xs text-muted">Tap any preference above to update it.</p>
        <Link
          href={`/group/${groupId}`}
          className="mt-8 block rounded-2xl bg-brand py-3.5 text-center text-base font-bold text-brand-foreground"
        >
          Back to Group
        </Link>
      </div>
    );
  }

  if (doneSwiping) {
    return (
      <div className="mx-auto max-w-lg px-5 py-8">
        <h1 className="text-2xl font-extrabold">Your Home Profile</h1>
        <p className="mt-1 text-sm text-muted">Review before you lock it in.</p>
        <div className="mt-6">
          <ProfileSummaryView summary={summary} />
        </div>
        <button
          onClick={handleLock}
          className="mt-8 w-full rounded-2xl bg-brand py-3.5 text-base font-bold text-brand-foreground shadow-lg shadow-brand/25"
        >
          Lock My Preferences
        </button>
      </div>
    );
  }

  const answeredCount = deck.length - remaining.length;

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-6">
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs font-bold text-muted">
          <span>Preference Tinder</span>
          <span>
            {answeredCount} / {deck.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
            style={{ width: `${(answeredCount / deck.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative" style={{ height: 480 }}>
        <SwipeStack
          items={remaining}
          keyExtractor={(c) => c.id}
          isDraggable={(c) => c.kind === "priority" || c.kind === "location"}
          dragLabels={{ left: "❌", right: "❤️" }}
          renderCard={(card, commit) => (
            <PreferenceCardBody
              card={card}
              index={answeredCount}
              total={deck.length}
              commit={commit}
              onValueChange={(v) => (pendingValues.current[card.id] = v)}
            />
          )}
          onCommit={(card, direction, intensity) => {
            saveAnswer(card, direction, intensity);
            setRemaining((prev) => prev.filter((c) => c.id !== card.id));
          }}
          emptyState={<p className="text-center text-muted">All done!</p>}
        />
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Swipe or tap a button — drag further for a stronger reaction.
      </p>
    </div>
  );
}
