export interface VaultEntry {
  id: string;
  siteName: string;
  website?: string;
  username: string;
  password: string;
  tag?: string | string[];

  // ✅ ADD THIS
  notes?: string;

  created_at?: string;
}