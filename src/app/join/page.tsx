"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGroup } from "@/lib/apiClient";
import { Input, Field } from "@/components/ui/Input";

function extractGroupId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/group\/([a-zA-Z0-9]+)/);
  return match ? match[1] : trimmed;
}

export default function JoinGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const groupId = extractGroupId(code);
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      await getGroup(groupId);
      router.push(`/group/${groupId}`);
    } catch {
      setError("We couldn't find a group with that link or code.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-6 text-sm font-semibold text-muted hover:text-brand">
        ← Back
      </Link>
      <h1 className="text-3xl font-extrabold">Join a group</h1>
      <p className="mt-2 text-muted">Paste the invite link a friend shared with you.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <Field label="Invite link or group code">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="https://.../group/cmuf..."
            required
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-brand py-3.5 text-base font-bold text-brand-foreground shadow-lg shadow-brand/25 transition hover:brightness-105 disabled:opacity-50"
        >
          {loading ? "Looking…" : "Join Group"}
        </button>
      </form>
    </div>
  );
}
