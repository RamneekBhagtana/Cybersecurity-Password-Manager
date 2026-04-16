import { useEffect, useRef, useState, type ReactNode } from "react";
import type { VaultEntry } from "../types/vault";
import Card from "./ui/Card";
import { deleteVaultEntry } from "../services/vault";

type Props = {
  entry: VaultEntry;
  onDeleted?: (id: string) => void;
  onEdit?: (entry: VaultEntry) => void;
};

function MenuItem({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 text-left text-sm transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-900 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function VaultEntryCard({ entry, onDeleted, onEdit }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    const ok = window.confirm(`Delete ${entry.siteName}?`);
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteVaultEntry(entry.id);
      onDeleted?.(entry.id);
    } catch {
      alert("Could not delete this entry. Please try again.");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(entry);
    setMenuOpen(false);
  };

  const favicon = entry.website
    ? `https://www.google.com/s2/favicons?domain=${entry.website}&sz=64`
    : null;

  const fallback = entry.siteName.slice(0, 1).toUpperCase();

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-11 w-11 rounded-2xl bg-white object-contain p-2 shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(108,99,255,0.12)] text-sm font-bold text-[var(--primary)]">
            {fallback}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {entry.siteName}
          </h3>
          <p className="text-sm text-[var(--muted)]">{entry.username}</p>
          <p className="mt-1 text-sm font-mono tracking-wide text-[var(--text)]">
            {revealed ? entry.password : "••••••••••"}
          </p>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More options"
          className="rounded-full px-3 py-1 text-2xl leading-none text-slate-700 hover:bg-slate-100"
        >
          ⋯
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <MenuItem onClick={() => setRevealed((v) => !v)}>
              {revealed ? "Hide" : "Show"}
            </MenuItem>
            <MenuItem onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </MenuItem>
            <MenuItem onClick={handleEdit}>Edit</MenuItem>
            <MenuItem danger onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </div>
        ) : null}
      </div>
    </Card>
  );
}