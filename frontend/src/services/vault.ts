import api from "./api";
import type { VaultEntry, VaultListResponse } from "../types/vault";

export async function fetchVaultEntries(): Promise<VaultListResponse> {
  const { data } = await api.get<VaultListResponse>("/vault");
  return data;
}

export async function deleteVaultEntry(entryId: string): Promise<void> {
  await api.delete(`/vault/${entryId}`);
}

// Fetches one entry w/ the decrypted password
// Backend requires master_password in the request body
export async function fetchVaultEntryDetail(
  entryId: string,
  masterPassword: string
): Promise<VaultEntry> {
  const { data } = await api.post<VaultEntry>(`/vault/${entryId}`, {
    master_password: masterPassword,
  });
  return data;
}

export async function createVaultEntry(payload: {
  title: string;
  password: string;
  master_password: string;
  username?: string;
  url?: string;
  notes?: string;
  tags?: string[];
}): Promise<{ entry_id: string }> {
  const { data } = await api.post<{ entry_id: string }>("/vault", payload);
  return data;
}

export async function updateVaultEntry(
  entryId: string,
  payload: Partial<{
    title: string;
    username: string;
    url: string;
    notes: string;
    password: string;
    master_password: string;
    tags: string[];
  }>
): Promise<void> {
  await api.put(`/vault/${entryId}`, payload);
}