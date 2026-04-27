import AppLayout from "../layouts/AppLayout";
import { Link, useLocation } from "react-router-dom";
import { useVaultEntries } from "../hooks/useVaultEntries";
import VaultEntryCard from "../components/VaultEntryCard";
import { useEffect, useState, useMemo } from "react";

export default function Dashboard() {
  const { entries = [], reusedCount, loading, reload } = useVaultEntries();
  const location = useLocation();

  useEffect(() => {
    reload();
  }, [location.pathname]);

  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const term = search.toLowerCase();
      return (
        entry.title?.toLowerCase().includes(term) ||
        entry.username?.toLowerCase().includes(term)
      );
    });
  }, [entries, search]);

  const strongPasswords = entries.filter(
    (e) => e.password_strength != null && e.password_strength >= 3
  ).length;

  const weakPasswords = entries.filter(
    (e) => e.password_strength != null && e.password_strength <= 2
  ).length;

  const securityScore = Math.max(
    0,
    100 - weakPasswords * 10 - reusedCount * 10
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div
          className="rounded-[28px] p-8 relative overflow-hidden"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--shadow-medium)",
          }}
        >
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-white/70 font-bold">
              Overview
            </p>
            <h1 className="text-4xl font-bold text-white mt-1">Dashboard</h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">
              Track your vault activity, search credentials quickly, and manage your saved entries.
            </p>
          </div>
          <div
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.4)" }}
          />
          <div
            className="absolute right-20 -bottom-16 w-32 h-32 rounded-full opacity-10"
            style={{ background: "rgba(255,255,255,0.4)" }}
          />
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div
            className="rounded-[28px] p-6 transition hover:scale-[1.02]"
            style={{
              background: "var(--gradient-stat)",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm text-[var(--muted)] font-medium">Saved passwords</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">{entries.length}</p>
          </div>

          <div
            className="rounded-[28px] p-6 transition hover:scale-[1.02]"
            style={{
              background: "var(--gradient-stat)",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm text-[var(--muted)] font-medium">Strong passwords</p>
            <p className="mt-2 text-3xl font-bold text-green-500">{strongPasswords}</p>
          </div>

          <div
            className="rounded-[28px] p-6 transition hover:scale-[1.02]"
            style={{
              background: "var(--gradient-stat)",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm text-[var(--muted)] font-medium">Security score</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">{securityScore}%</p>
          </div>
        </div>

        {/* SEARCH */}
        <div
          className="rounded-[28px] p-6"
          style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-soft)",
            border: "1px solid var(--border)",
          }}
        >
          <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
            Search Vault
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by site name or username"
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              style={{
                background: "var(--surface)",
                border: "2px solid var(--border)",
              }}
            />
          </div>
        </div>

        {/* VAULT + ACTIONS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* VAULT ENTRIES */}
          <div
            className="rounded-[28px] p-6 space-y-4"
            style={{
              background: "var(--gradient-card)",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-[var(--text)]">Vault entries</h2>
              <Link
                to="/vault"
                className="text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                View all →
              </Link>
            </div>

            {loading && (
              <p className="text-sm text-[var(--muted)]">Loading...</p>
            )}

            {!loading && filteredEntries.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--muted)]">
                  {search ? "No matching entries." : "No entries yet."}
                </p>
              </div>
            )}

            <div className="space-y-3">
  {!loading &&
    filteredEntries.slice(0, 4).map((entry) => {
      const favicon = entry.url
        ? `https://www.google.com/s2/favicons?domain=${entry.url}&sz=64`
        : null;
      const fallback = entry.title.slice(0, 1).toUpperCase();
      return (
        <div
          key={entry.entry_id}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="h-10 w-10 rounded-xl bg-white object-contain p-1.5 shadow-sm flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(108,99,255,0.12)] text-sm font-bold text-[var(--primary)] flex-shrink-0">
              {fallback}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--text)] truncate">{entry.title}</p>
            <p className="text-xs text-[var(--muted)] truncate">{entry.username}</p>
          </div>
        </div>
            );
          })}
          </div>
          </div>

          {/* QUICK ACTIONS */}
          <div
            className="rounded-[28px] p-6 space-y-4"
            style={{
              background: "var(--gradient-card)",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="font-bold text-lg text-[var(--text)]">Quick actions</h2>

            <div className="space-y-2">
              <Link
                to="/vault"
                className="flex items-center justify-between p-4 rounded-2xl transition hover:translate-x-1 hover:bg-[var(--surface-1)]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <span className="font-semibold text-[var(--text)]">Open Vault</span>
                </div>
                <span className="text-[var(--primary)]">→</span>
              </Link>

              <Link
                to="/generator"
                className="flex items-center justify-between p-4 rounded-2xl transition hover:translate-x-1 hover:bg-[var(--surface-1)]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <span className="font-semibold text-[var(--text)]">Generate Password</span>
                </div>
                <span className="text-[var(--primary)]">→</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-4 rounded-2xl transition hover:translate-x-1 hover:bg-[var(--surface-1)]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛡️</span>
                  <span className="font-semibold text-[var(--text)]">Security Reports</span>
                </div>
                <span className="text-[var(--primary)]">→</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-4 rounded-2xl transition hover:translate-x-1 hover:bg-[var(--surface-1)]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚙️</span>
                  <span className="font-semibold text-[var(--text)]">Profile Settings</span>
                </div>
                <span className="text-[var(--primary)]">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}