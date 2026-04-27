import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/ui/Button";
import VaultEntryCard from "../components/VaultEntryCard";
import VaultForm from "../components/VaultForm";
import type { VaultEntry } from "../types/vault";
import { TAG_OPTIONS } from "../types/vault";
import { useVaultEntries } from "../hooks/useVaultEntries";

export default function Vault() {
  const { entries, loading, error, reload, removeEntry } = useVaultEntries();
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeTag, setActiveTag] = useState<string>("All");

  const location = useLocation();
  useEffect(() => {
    const editId = (location.state as any)?.editEntryId;
    if (editId && entries.length > 0) {
      const target = entries.find((e) => e.entry_id === editId);
      if (target) setEditingEntry(target);
    }
  }, [location.state, entries]);

  const filteredEntries = useMemo(() => {
    if (activeTag === "All") return entries;
    return entries.filter((e) => e.tags?.includes(activeTag));
  }, [entries, activeTag]);

  const handleDeleted = async (id: string) => {
    await removeEntry(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Vault</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Your saved accounts and passwords.
            </p>
          </div>
          <Button onClick={() => setIsAddingNew(true)}>+ Add</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", ...TAG_OPTIONS].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTag === tag
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:opacity-80"
              }`}
              style={
                activeTag !== tag
                  ? {
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }
                  : undefined
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={reload}
              className="text-sm font-semibold text-red-700 dark:text-red-300 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <p className="text-sm text-[var(--muted)]">Loading vault...</p>
        )}

        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <VaultEntryCard
              key={entry.entry_id}
              entry={entry}
              onDeleted={handleDeleted}
              onEdit={(item) => setEditingEntry(item)}
            />
          ))}

          {!loading && filteredEntries.length === 0 && (
            <div
              className="text-center py-20 rounded-[32px] border-2 border-dashed"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-[var(--muted)]">
                {activeTag === "All"
                  ? "Your vault is empty."
                  : `No entries tagged "${activeTag}".`}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {activeTag === "All"
                  ? 'Click "+ Add" to save your first password.'
                  : "Try another tag or add a new entry."}
              </p>
            </div>
          )}
        </div>
      </div>

      {(editingEntry || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <VaultForm
              initialData={editingEntry}
              onSuccess={() => {
                setEditingEntry(null);
                setIsAddingNew(false);
                reload();
              }}
              onCancel={() => {
                setEditingEntry(null);
                setIsAddingNew(false);
              }}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}