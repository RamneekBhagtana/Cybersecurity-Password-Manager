import { useEffect, useRef, useState, type ReactNode } from "react";
import type { VaultEntry } from "../types/vault";
import { fetchVaultEntryDetail } from "../services/vault";
import Card from "./ui/Card";

type Props = {
  entry: VaultEntry;
  onDeleted?: (id: string) => Promise<void> | void;
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
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-900 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

const STRENGTH_MAP: Record<number, { label: string; bg: string }> = {
  1: { label: "Weak", bg: "#ef4444" },
  2: { label: "Fair", bg: "#f97316" },
  3: { label: "Good", bg: "#22c55e" },
  4: { label: "Strong", bg: "#10b981" },
};

function StrengthBadges({ score, isReused }: { score: number | null; isReused: boolean }) {
  const strength = score != null ? STRENGTH_MAP[score] : null;
  if (!strength && !isReused) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {strength && (
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ background: strength.bg, color: "white" }}
        >
          {strength.label}
        </span>
      )}
      {isReused && (
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ background: "#eab308", color: "white" }}
        >
          Reused
        </span>
      )}
    </div>
  );
}

export default function VaultEntryCard({ entry, onDeleted, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const [masterPwModalOpen, setMasterPwModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"show" | "copy" | null>(null);
  const [masterPwInput, setMasterPwInput] = useState("");
  const [showMasterPw, setShowMasterPw] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openMasterPwModal = (action: "show" | "copy") => {
    setPendingAction(action);
    setMasterPwInput("");
    setShowMasterPw(false);
    setFetchError("");
    setMasterPwModalOpen(true);
    setMenuOpen(false);
  };

  const submitMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPwInput.trim()) {
      setFetchError("Master password is required.");
      return;
    }

    setFetching(true);
    setFetchError("");
    try {
      const detail = await fetchVaultEntryDetail(entry.entry_id, masterPwInput);
      const plaintext = detail.password || "";

      if (pendingAction === "show") {
        setRevealedPassword(plaintext);
        setRevealed(true);
      } else if (pendingAction === "copy") {
        await navigator.clipboard.writeText(plaintext);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }

      setMasterPwModalOpen(false);
      setMasterPwInput("");
    } catch {
      setFetchError("Master password is incorrect.");
    } finally {
      setFetching(false);
    }
  };

  const hidePassword = () => {
    setRevealed(false);
    setRevealedPassword("");
  };

  const handleDelete = async () => {
    const ok = window.confirm(`Delete ${entry.title}?`);
    if (!ok) return;

    setDeleting(true);
    try {
      await onDeleted?.(entry.entry_id);
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(entry);
    setMenuOpen(false);
  };

  const favicon = entry.url
    ? `https://www.google.com/s2/favicons?domain=${entry.url}&sz=64`
    : null;

  const fallback = entry.title.slice(0, 1).toUpperCase();

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-11 w-11 rounded-2xl bg-white object-contain p-2 shadow-sm flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(108,99,255,0.12)] text-sm font-bold text-[var(--primary)] flex-shrink-0">
            {fallback}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--text)] truncate">{entry.title}</h3>
          <p className="text-sm text-[var(--muted)] truncate">{entry.username}</p>
          <StrengthBadges score={entry.password_strength} isReused={entry.is_reused} />
          <p className="mt-1 text-sm font-mono tracking-wide text-[var(--text)] break-all">
            {revealed ? revealedPassword : "••••••••••"}
          </p>
        </div>
      </div>

      <div className="relative flex-shrink-0" ref={menuRef}>
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
            {revealed ? (
              <MenuItem onClick={hidePassword}>Hide</MenuItem>
            ) : (
              <MenuItem onClick={() => openMasterPwModal("show")}>Show</MenuItem>
            )}
            <MenuItem onClick={() => openMasterPwModal("copy")}>
              {copied ? "Copied" : "Copy"}
            </MenuItem>
            <MenuItem onClick={handleEdit}>Edit</MenuItem>
            <MenuItem danger onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </div>
        ) : null}
      </div>

      {masterPwModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={submitMasterPassword}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-black">
                {pendingAction === "show" ? "Show Password" : "Copy Password"}
              </h2>
              <button
                type="button"
                onClick={() => setMasterPwModalOpen(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Enter your master password (your login password) to decrypt the password for{" "}
              <strong>{entry.title}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-400">Master Password</label>
              <div className="relative">
                <input
                  autoFocus
                  name="vault-decrypt-password"
                  autoComplete="new-password"
                  type={showMasterPw ? "text" : "password"}
                  value={masterPwInput}
                  onChange={(e) => setMasterPwInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 pr-16 text-black outline-none focus:border-[var(--primary)]"
                  placeholder="Your master password"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPw(!showMasterPw)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {showMasterPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {fetchError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMasterPwModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={fetching}
                className="flex-1 rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {fetching ? "Decrypting..." : pendingAction === "show" ? "Show" : "Copy"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}