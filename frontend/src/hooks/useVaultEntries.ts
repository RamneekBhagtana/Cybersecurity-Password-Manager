import { useCallback, useEffect, useState } from "react";
import { fetchVaultEntries, deleteVaultEntry } from "../services/vault";

export function useVaultEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchVaultEntries();

      console.log("HOOK DATA:", data); // 🔥 DEBUG

      setEntries(data || []);
    } catch (err) {
      console.error("Vault load failed:", err);
      setEntries([]);
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
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return {
    entries,
    loading,
    error,
    reload: loadEntries,
    removeEntry,
  };
}