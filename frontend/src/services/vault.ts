import api from "./api";
import type { VaultEntry } from "../types/vault";

export async function fetchVaultEntries() {
  const res = await api.get<VaultEntry[]>("/vault");
  return res.data;
}

export async function deleteVaultEntry(id: string) {
  await api.delete(`/vault/${id}`);
}