// src/types/vault.ts
export interface VaultEntry {
  entry_id: string;
  title: string;
  username?: string | null;
  url?: string | null;
  notes?: string | null;
  tags: string[];
  password_strength: number | null;
  is_reused: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  password?: string;
}

export interface VaultListResponse {
  entries: VaultEntry[];
  reused_count: number;
}

export const TAG_OPTIONS = [
  "Work",
  "Personal",
  "School",
  "Entertainment",
] as const;