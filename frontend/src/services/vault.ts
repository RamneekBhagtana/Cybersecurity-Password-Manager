import api from "./api";
import type { VaultEntry } from "../types/vault";

type RawVaultEntry = Record<string, unknown>;

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function unwrapEntries(data: unknown): RawVaultEntry[] {
  if (Array.isArray(data)) {
    return data as RawVaultEntry[];
  }

  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: RawVaultEntry[] }).data;
  }

  return [];
}

function normalizeEntry(raw: RawVaultEntry): VaultEntry {
  const id = asString(raw.id ?? raw.vault_id ?? raw._id);
  const siteName = asString(raw.siteName ?? raw.site_name ?? raw.name ?? raw.title);
  const website = asString(raw.website ?? raw.url ?? raw.domain);
  const username = asString(raw.username ?? raw.login ?? raw.user ?? raw.email);
  const password = asString(raw.password ?? raw.secret ?? raw.value);
  const tag = asString(raw.tag ?? raw.category ?? raw.label);

  return {
    id,
    siteName: siteName || "Untitled",
    website: website || undefined,
    username,
    password,
    tag: tag || undefined,
  };
}

export async function fetchVaultEntries(): Promise<VaultEntry[]> {
  const response = await api.get("/vault");
  const rawEntries = unwrapEntries(response.data);

  return rawEntries
    .map(normalizeEntry)
    .filter((entry) => entry.id && entry.siteName);
}

export async function deleteVaultEntry(id: string): Promise<void> {
  await api.delete(`/vault/${encodeURIComponent(id)}`);
}
