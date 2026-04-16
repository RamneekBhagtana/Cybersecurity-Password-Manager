import { useCallback, useEffect, useState } from "react";
import { MOCK_VAULT_ENTRIES } from "../data/mockVaultEntries";
import { deleteVaultEntry, fetchVaultEntries } from "../services/vault";
import type { VaultEntry } from "../types/vault";

type Source = "api" | "mock";

export function useVaultEntries() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState<Source>("api");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchVaultEntries();
      setEntries(data);
      setSource("api");
    } catch {
      setEntries(MOCK_VAULT_ENTRIES);
      setSource("mock");
      setError("Could not load vault entries right now. Showing sample data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const removeEntry = useCallback(
    async (id: string) => {
      if (source === "mock") {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
        return;
      }

      try {
        await deleteVaultEntry(id);
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
      } catch {
        setError("Could not delete that entry on the server. Please try again.");
      }
    },
    [source]
  );

  return {
    entries,
    loading,
    error,
    reload: loadEntries,
    removeEntry,
  };
}