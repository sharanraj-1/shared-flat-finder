"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Heart, Building2, Sparkles, ListChecks, Bookmark } from "lucide-react";
import { clearIdentity, type Identity } from "@/lib/session";

interface NavItem {
  href: (groupId: string) => string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match: (path: string, groupId: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: (id) => `/group/${id}`, label: "Group", icon: Home, match: (p, id) => p === `/group/${id}` },
  {
    href: (id) => `/group/${id}/preferences`,
    label: "Preferences",
    icon: Sparkles,
    match: (p, id) => p.startsWith(`/group/${id}/preferences`),
  },
  {
    href: (id) => `/group/${id}/apartments`,
    label: "Swipe",
    icon: Heart,
    match: (p, id) => p.startsWith(`/group/${id}/apartments`),
  },
  {
    href: (id) => `/group/${id}/matches`,
    label: "Matches",
    icon: Building2,
    match: (p, id) => p.startsWith(`/group/${id}/matches`),
  },
  {
    href: (id) => `/group/${id}/compare`,
    label: "Compare",
    icon: ListChecks,
    match: (p, id) => p.startsWith(`/group/${id}/compare`),
  },
  {
    href: (id) => `/group/${id}/shortlist`,
    label: "Shortlist",
    icon: Bookmark,
    match: (p, id) => p.startsWith(`/group/${id}/shortlist`),
  },
];

export function NavShell({
  groupId,
  identity,
  groupName,
  children,
}: {
  groupId: string;
  identity: Identity;
  groupName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function switchPerson() {
    clearIdentity(groupId);
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-border bg-card px-5 py-6 md:flex">
        <Link href="/" className="mb-8 text-lg font-extrabold text-brand">
          🏠 Shared Flat Finder
        </Link>
        <p className="mb-1 truncate text-xs font-semibold uppercase tracking-wide text-muted">{groupName}</p>
        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname, groupId);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href(groupId)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-brand-soft text-brand" : "text-muted hover:bg-muted-bg hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={switchPerson}
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
        >
          <span className="text-lg">{identity.emoji}</span>
          <span className="flex-1 truncate text-left">{identity.name}</span>
          <span className="text-xs">Switch</span>
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <Link href="/" className="text-base font-extrabold text-brand">
            🏠 Flat Finder
          </Link>
          <button
            onClick={switchPerson}
            className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm font-semibold"
          >
            <span>{identity.emoji}</span>
            {identity.name}
          </button>
        </header>

        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-card/95 py-1.5 backdrop-blur md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname, groupId);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href(groupId)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
