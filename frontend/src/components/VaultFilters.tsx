type Props = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
};

export default function VaultFilters({
  searchTerm,
  onSearchTermChange,
  tags,
  selectedTags,
  onToggleTag,
  onClearFilters,
  filteredCount,
  totalCount,
}: Props) {
  const allActive = selectedTags.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-white p-4 shadow-md shadow-slate-200/60">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--text)]">
            Search vault
          </span>
          <input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search by site name or username"
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(108,99,255,0.15)]"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleTag("All")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              allActive
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-2)] text-[var(--text)]"
            }`}
          >
            All
          </button>

          {tags.map((tag) => {
            const active = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--text)]"
                }`}
              >
                {tag}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Showing{" "}
        <span className="font-semibold text-[var(--text)]">{filteredCount}</span>{" "}
        of <span className="font-semibold text-[var(--text)]">{totalCount}</span>{" "}
        entries shown
      </p>
    </div>
  );
}