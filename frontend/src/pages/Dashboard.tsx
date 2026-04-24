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
    if (tag === "All") return setSelectedTags([]);

    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  const noMatches =
    !loading && !error && filteredEntries.length === 0 && entries.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Track your vault activity, search credentials quickly, and manage your saved entries.
          </p>
        </Card>

        {/* LOADING / ERROR */}
        {loading && (
          <Card>Loading vault...</Card>
        )}

        {error && (
          <Card>
            <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
            <button
              onClick={reload}
              className="mt-2 text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Try again
            </button>
          </Card>
        )}

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        {/* FILTERS */}
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

        {/* MAIN GRID */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">

          {/* VAULT */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  Vault entries
                </h2>
                <p className="text-sm text-[var(--muted)]">
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

            <div className="mt-4 space-y-3">
              {noMatches ? (
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="text-sm text-[var(--text)]">
                    No passwords match your filters.
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Try clearing filters.
                  </p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
                  No passwords saved yet.
                </div>
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
          </Card>

          {/* ACTIONS */}
          <Card>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3">
              Quick actions
            </h2>

            <div className="space-y-2">
              <Link
                to="/vault"
                className="block rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm hover:bg-[var(--surface-3)] transition"
              >
                Open Vault
              </Link>

              <Link
                to="/generator"
                className="block rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm hover:bg-[var(--surface-3)] transition"
              >
                Generate Password
              </Link>

              <Link
                to="/profile"
                className="block rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm hover:bg-[var(--surface-3)] transition"
              >
                Profile Settings
              </Link>
            </div>
          </Card>
        </div>

        {/* SECURITY */}
        <Card>
          <h2 className="text-xl font-bold text-[var(--text)]">
            Security status
          </h2>

          <div className="mt-4 rounded-xl bg-[var(--surface-2)] p-4">
            <p className="text-sm text-[var(--muted)]">Overall score</p>
            <p className="text-4xl font-bold text-[var(--primary)]">92%</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Your vault is in good shape.
            </p>
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
