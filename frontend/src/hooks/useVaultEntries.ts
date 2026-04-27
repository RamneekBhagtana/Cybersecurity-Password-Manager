import { useCallback, useEffect, useState } from "react";
import {
  fetchVaultEntries,
  deleteVaultEntry,
} from "../services/vault";
import type { VaultEntry } from "../types/vault";

export function useVaultEntries() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [reusedCount, setReusedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchVaultEntries();
      setEntries(data.entries || []);
      setReusedCount(data.reused_count || 0);
    } catch (err) {
      console.error("Vault load failed:", err);
      setEntries([]);
      setReusedCount(0);
      setError("Failed to load vault entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const removeEntry = async (id: string) => {
    try {
      await deleteVaultEntry(id);
      setEntries((prev) => prev.filter((e) => e.entry_id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return {
    entries,
    reusedCount,
    loading,
    error,
    reload: loadEntries,
    removeEntry,
  };
}