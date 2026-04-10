import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import VaultEntryCard from "../components/VaultEntryCard";
import type { VaultEntry } from "../types/vault";
import { useState } from "react";

const initialEntries: VaultEntry[] = [
  {
    id: "1",
    siteName: "Netflix",
    website: "netflix.com",
    username: "adrita@email.com",
    password: "netflix-password-123",
    tag: "Personal",
  },
  {
    id: "2",
    siteName: "GitHub",
    website: "github.com",
    username: "adrita.dev",
    password: "github-password-123",
    tag: "Work",
  },
  {
    id: "3",
    siteName: "Notion",
    website: "notion.so",
    username: "adrita.study",
    password: "notion-password-123",
    tag: "School",
  },
];

export default function Dashboard() {
  const [entries, setEntries] = useState<VaultEntry[]>(initialEntries);

  const stats = [
    { label: "Saved passwords", value: "24" },
    { label: "Strong passwords", value: "18" },
    { label: "Security score", value: "92%" },
  ];

  const recentEntries = entries.slice(0, 2);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-[32px] bg-gradient-to-br from-[#120f2f] via-[#25154d] to-[#0d1022] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Track your vault activity, check your security status, and jump into your most recent entries.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Recent entries</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  A quick look at your latest saved passwords.
                </p>
              </div>

              <Link
                to="/vault"
                className="text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <VaultEntryCard
                  key={entry.id}
                  entry={entry}
                  onDeleted={(id) =>
                    setEntries((prev) => prev.filter((item) => item.id !== id))
                  }
                  onEdit={(item) => console.log("edit", item)}
                />
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-bold">Quick actions</h2>

            <Link
              to="/vault"
              className="block rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:bg-slate-200/70"
            >
              Open Vault
            </Link>

            <Link
              to="/generator"
              className="block rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:bg-slate-200/70"
            >
              Generate Password
            </Link>

            <Link
              to="/profile"
              className="block rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:bg-slate-200/70"
            >
              Profile Settings
            </Link>
          </Card>
        </div>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Security status</h2>
          <div className="rounded-[24px] bg-[rgba(108,99,255,0.08)] p-4">
            <p className="text-sm text-[var(--muted)]">Overall score</p>
            <p className="mt-1 text-4xl font-bold text-[var(--primary)]">92%</p>
            <p className="mt-2 text-sm text-[var(--text)]">
              Your vault is in good shape. Keep using strong passwords and review weak ones later.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Weak passwords</span>
              <span className="font-semibold text-[var(--danger)]">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span>2FA enabled</span>
              <span className="font-semibold text-[var(--success)]">Yes</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vault synced</span>
              <span className="font-semibold text-[var(--success)]">Yes</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}