import { supabase } from "../lib/supabase";
import type { VaultEntry } from "../types/vault";

export async function fetchVaultEntries(): Promise<VaultEntry[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("vault_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data || [];
}

export async function deleteVaultEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("vault_entries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
  }
}