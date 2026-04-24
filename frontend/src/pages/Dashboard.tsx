import AppLayout from "../layouts/AppLayout";
import { Link, useLocation } from "react-router-dom";
import { useVaultEntries } from "../hooks/useVaultEntries";
import VaultEntryCard from "../components/VaultEntryCard";
import { useEffect, useState, useMemo } from "react";

export default function Dashboard() {
  const { entries = [], loading, reload } = useVaultEntries();
  const location = useLocation();

  // 🔥 reload when coming back to dashboard
  useEffect(() => {
    reload();
  }, [location.pathname]);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry: any) => {
      const matchesSearch =
        entry.siteName?.toLowerCase().includes(search.toLowerCase()) ||
        entry.username?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "All" ||
        entry.tag?.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [entries, search, activeFilter]);

  const strongPasswords = entries.filter(
    (e: any) => e.password?.length >= 12
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)]">
          <p className="text-xs uppercase text-[var(--muted)]">Overview</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Track your vault activity, search credentials quickly, and manage your saved entries.
          </p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)]">
            <p className="text-sm text-[var(--muted)]">Saved passwords</p>
            <p className="mt-2 text-3xl font-bold">{entries.length}</p>
          </div>

          <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)]">
            <p className="text-sm text-[var(--muted)]">Strong passwords</p>
            <p className="mt-2 text-3xl font-bold">{strongPasswords}</p>
          </div>

          <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)]">
            <p className="text-sm text-[var(--muted)]">Security score</p>
            <p className="mt-2 text-3xl font-bold">
              {Math.max(0, 100 - entries.length * 2)}%
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)] space-y-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by site name or username"
            className="w-full p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]"
          />
        </div>

        {/* VAULT + ACTIONS */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* VAULT ENTRIES */}
          <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)] space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold">Vault entries</h2>
              <Link to="/vault" className="text-sm text-[var(--primary)]">
                View all
              </Link>
            </div>

            {loading && (
              <p className="text-sm text-[var(--muted)]">Loading...</p>
            )}

            {!loading && filteredEntries.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                No entries found.
              </p>
            )}

            <div className="space-y-3">
              {!loading &&
                filteredEntries.slice(0, 5).map((entry: any) => (
                  <VaultEntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)] space-y-3">
            <Link
              to="/vault"
              className="block p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition shadow-sm hover:shadow-md"
            >
              Open Vault
            </Link>

            <Link
              to="/generator"
              className="block p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition shadow-sm hover:shadow-md"
            >
              Generate Password
            </Link>

            <Link
              to="/profile"
              className="block p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition shadow-sm hover:shadow-md"
            >
              Profile Settings
            </Link>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}