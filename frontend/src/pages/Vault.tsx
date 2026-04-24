import { useState, useEffect } from "react";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/ui/Button";
import VaultEntryCard from "../components/VaultEntryCard";
import type { VaultEntry } from "../types/vault";
import VaultForm from "../components/VaultForm"; 
import { supabase } from "../lib/supabase";

export default function Vault() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Function to pull real data from your new 'vault' table
  const fetchVaultEntries = async () => {
    const { data, error } = await supabase
      .from("vault")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setEntries(data);
    } else if (error) {
      console.error("Error fetching vault:", error.message);
    }
  };

  useEffect(() => {
    fetchVaultEntries();
  }, []);

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
          <Button onClick={() => setIsAddingNew(true)}>+ Add</Button>
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
          
          {entries.length === 0 && (
            <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200">
              <p className="text-[var(--muted)]">Your vault is empty.</p>
              <p className="text-sm text-[var(--muted)]">Click "+ Add" to save your first password.</p>
            </div>
          )}
        </div>
      </div>

      {/* This Modal handles both ADDING and EDITING */}
      {(editingEntry || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">
            <VaultForm 
              initialData={editingEntry} 
              onSuccess={() => {
                setEditingEntry(null);
                setIsAddingNew(false);
                fetchVaultEntries();
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