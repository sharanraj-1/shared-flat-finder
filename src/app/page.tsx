import Link from "next/link";

const FLOW_STEPS = ["Your Preferences", "Friends' Preferences", "Group Match", "Apartments", "Decision"];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="text-lg font-extrabold text-brand">🏠 Shared Flat Finder</span>
      </header>

      <section className="mt-16 flex flex-1 flex-col items-center text-center">
        <span className="rounded-full bg-brand-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand">
          Match first. Then find a home.
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Find a flat everyone can{" "}
          <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
            actually agree on
          </span>
          .
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Three friends. Different priorities. One home. Tell us what matters to you, match your preferences, and
          discover apartments you can actually discuss together.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/create"
            className="rounded-2xl bg-brand px-7 py-3.5 text-base font-bold text-brand-foreground shadow-lg shadow-brand/25 transition hover:brightness-105"
          >
            Create a Group
          </Link>
          <Link
            href="/join"
            className="rounded-2xl border-2 border-border bg-card px-7 py-3.5 text-base font-bold transition hover:border-accent hover:text-accent"
          >
            Join a Group
          </Link>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-3">
          {FLOW_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold shadow-sm">
                {step}
              </div>
              {i < FLOW_STEPS.length - 1 && <span className="text-2xl text-muted">→</span>}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-border pt-6 text-center text-sm text-muted">
        Don&apos;t find a flat first and argue later. Match your priorities first — then find a home together.
      </footer>
    </div>
  );
}
