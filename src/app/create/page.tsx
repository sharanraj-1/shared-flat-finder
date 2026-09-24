"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGroup } from "@/lib/apiClient";
import { setIdentity } from "@/lib/session";
import { Input, Field } from "@/components/ui/Input";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Pune");
  const [moveInDate, setMoveInDate] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !creatorName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createGroup({
        name: name.trim(),
        city: city.trim(),
        moveInDate: moveInDate.trim(),
        creatorName: creatorName.trim(),
      });
      setIdentity(res.groupId, { userId: res.userId, name: creatorName.trim(), emoji: "🌸" });
      router.push(`/group/${res.groupId}/invite`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-6 text-sm font-semibold text-muted hover:text-brand">
        ← Back
      </Link>
      <h1 className="text-3xl font-extrabold">Create your group</h1>
      <p className="mt-2 text-muted">Who&apos;s in, where you&apos;re looking, and when you need to move.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <Field label="Your name">
          <Input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="e.g. Riya" required />
        </Field>

        <Field label="Group name" hint="e.g. Riya • Meera • Kavita">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya • Meera • Kavita" required />
        </Field>

        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" required />
        </Field>

        <Field label="Target move-in date" hint="Optional">
          <Input value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} placeholder="October 2026" />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-2xl bg-brand py-3.5 text-base font-bold text-brand-foreground shadow-lg shadow-brand/25 transition hover:brightness-105 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Group"}
        </button>
      </form>
    </div>
  );
}
