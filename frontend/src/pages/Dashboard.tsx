import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import VaultEntryCard from "../components/VaultEntryCard";
import VaultFilters from "../components/VaultFilters";
import { useVaultEntries } from "../hooks/useVaultEntries";
import { filterVaultEntries, getUniqueTags } from "../utils/vaultFilters";

export default function Dashboard() {
  const { entries, loading, error, reload, removeEntry } = useVaultEntries();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = useMemo(() => getUniqueTags(entries), [entries]);

  const filteredEntries = useMemo(
    () => filterVaultEntries(entries, searchTerm, selectedTags),
    [entries, searchTerm, selectedTags]
  );

  const stats = [
    { label: "Saved passwords", value: String(entries.length) },
    { label: "Strong passwords", value: "18" },
    { label: "Security score", value: "92%" },
  ];

  const toggleTag = (tag: string) => {
    if (tag === "All") {
      setSelectedTags([]);
      return;
    }

    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchTerm.trim().length > 0 || selectedTags.length > 0;
  const noMatches =
    !loading && !error && filteredEntries.length === 0 && entries.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-[32px] bg-gradient-to-br from-[#120f2f] via-[#25154d] to-[#0d1022] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Track your vault activity, search credentials quickly, and jump into your recent entries.
          </p>
        </div>

        {loading ? (
          <Card>Loading vault...</Card>
        ) : error ? (
          <Card className="space-y-3">
            <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Try again
            </button>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </Card>
          ))}
        </div>

        <VaultFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearFilters={clearFilters}
          filteredCount={filteredEntries.length}
          totalCount={entries.length}
        />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Vault entries</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Your saved passwords at a glance.
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
              {noMatches ? (
                <div className="rounded-[24px] bg-[var(--surface-2)] p-4">
                  <p className="text-sm font-medium text-[var(--text)]">
                    No passwords match your filters.
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Clear the search or tag filters to see more results.
                  </p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <p className="rounded-[24px] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
                  No passwords saved yet.
                </p>
              ) : (
                filteredEntries.slice(0, 2).map((entry) => (
                  <VaultEntryCard
                    key={entry.id}
                    entry={entry}
                    onDeleted={removeEntry}
                    onEdit={(item) => console.log("edit", item)}
                  />
                ))
              )}
            </div>

            {hasActiveFilters && filteredEntries.length > 2 ? (
              <p className="text-sm text-[var(--muted)]">
                Showing the first 2 filtered entries here. Open Vault to see the full list.
              </p>
            ) : null}
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