import type { VaultEntry } from "../types/vault";

export function getUniqueTags(entries: VaultEntry[]) {
  return Array.from(
    new Set(
      entries
        .map((entry) => entry.tag?.trim())
        .filter((tag): tag is string => Boolean(tag))
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function filterVaultEntries(
  entries: VaultEntry[],
  searchTerm: string,
  selectedTags: string[]
) {
  const query = searchTerm.trim().toLowerCase();

  return entries.filter((entry) => {
    const matchesSearch =
      query.length === 0 ||
      entry.siteName.toLowerCase().includes(query) ||
      entry.username.toLowerCase().includes(query);

    const matchesTags =
      selectedTags.length === 0 ||
      (entry.tag ? selectedTags.includes(entry.tag) : false);

    return matchesSearch && matchesTags;
  });
}