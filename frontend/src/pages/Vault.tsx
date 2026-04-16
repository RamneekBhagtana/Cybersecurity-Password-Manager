import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/ui/Button";
import VaultEntryCard from "../components/VaultEntryCard";
import type { VaultEntry } from "../types/vault";

const initialItems: VaultEntry[] = [
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
    website: "notion.com",
    username: "adrita.study",
    password: "notion-password-123",
    tag: "School",
  },
  {
    id: "4",
    siteName: "Discord",
    website: "Discord.com",
    username: "adrita#2048",
    password: "discord-password-123",
    tag: "Personal",
  },
];

export default function Vault() {
  const [entries, setEntries] = useState<VaultEntry[]>(initialItems);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  const handleDeleted = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              Vault
            </p>
            <h1 className="mt-2 text-3xl font-bold">My Vault</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Your saved accounts and passwords.
            </p>
          </div>
          <Button>+ Add</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Work", "Personal", "School"].map((tag, index) => (
            <button
              key={tag}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                index === 0
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white text-[var(--muted)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <VaultEntryCard
              key={entry.id}
              entry={entry}
              onDeleted={handleDeleted}
              onEdit={(item) => setEditingEntry(item)}
            />
          ))}
        </div>
      </div>

      {editingEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Edit entry</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Task 23 will replace this with the real edit form.
            </p>

            <div className="mt-4 rounded-2xl bg-[var(--surface-2)] p-4">
              <p className="font-semibold">{editingEntry.siteName}</p>
              <p className="text-sm text-[var(--muted)]">{editingEntry.username}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setEditingEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}