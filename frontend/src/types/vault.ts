export interface VaultEntry {
  id: string;
  siteName: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  tag?: string[];
  created_at?: string;

};