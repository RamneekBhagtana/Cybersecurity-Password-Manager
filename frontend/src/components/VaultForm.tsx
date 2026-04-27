import { useState } from "react";
import Generator from "../components/Generator";
import Button from "./ui/Button";
import {
  createVaultEntry,
  updateVaultEntry,
  fetchVaultEntries,
  fetchVaultEntryDetail,
} from "../services/vault";
import type { VaultEntry } from "../types/vault";
import { TAG_OPTIONS } from "../types/vault";

interface VaultFormProps {
  initialData?: VaultEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VaultForm({ initialData, onSuccess, onCancel }: VaultFormProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);

  const [draftPassword, setDraftPassword] = useState("");
  const [draftMasterPassword, setDraftMasterPassword] = useState("");
  const [draftShowPassword, setDraftShowPassword] = useState(false);
  const [draftShowMasterPassword, setDraftShowMasterPassword] = useState(false);
  const [validating, setValidating] = useState(false);

  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };
  const surfaceStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openPasswordModal = () => {
    setDraftPassword(password);
    setDraftMasterPassword(masterPassword);
    setDraftShowPassword(false);
    setDraftShowMasterPassword(false);
    setErrorMsg(null);
    setIsPasswordModalOpen(true);
  };

  const applyPasswordChange = async () => {
    if (!draftPassword.trim()) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (!draftMasterPassword.trim()) {
      setErrorMsg("Master password is required.");
      return;
    }

    if (isEditing && initialData) {
      setValidating(true);
      try {
        await fetchVaultEntryDetail(initialData.entry_id, draftMasterPassword);
      } catch {
        setValidating(false);
        setErrorMsg("Master password is incorrect.");
        return;
      }
      setValidating(false);
    }

    setPassword(draftPassword);
    setMasterPassword(draftMasterPassword);
    setErrorMsg(null);
    setIsPasswordModalOpen(false);
  };

  const clearPasswordChange = () => {
    setPassword("");
    setMasterPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const passwordChanging = password.trim().length > 0;

    if ((!isEditing || passwordChanging) && !masterPassword.trim()) {
      setErrorMsg("Master password is required.");
      return;
    }

    setSubmitting(true);

    if (passwordChanging || !isEditing) {
      try {
        let testEntryId: string | null = null;
        if (isEditing && initialData) {
          testEntryId = initialData.entry_id;
        } else {
          const list = await fetchVaultEntries();
          if (list.entries.length > 0) {
            testEntryId = list.entries[0].entry_id;
          }
        }

        if (testEntryId) {
          await fetchVaultEntryDetail(testEntryId, masterPassword);
        }
      } catch {
        setSubmitting(false);
        setErrorMsg(
          "Master password is incorrect."
        );
        return;
      }
    }

    try {
      if (isEditing && initialData) {
        const payload: any = {
          title,
          username,
          url,
          notes,
          tags: selectedTags,
        };
        if (passwordChanging) {
          payload.password = password;
          payload.master_password = masterPassword;
        }
        await updateVaultEntry(initialData.entry_id, payload);
      } else {
        await createVaultEntry({
          title,
          username,
          url,
          notes,
          password,
          master_password: masterPassword,
          tags: selectedTags,
        });
      }
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to save entry.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-left relative"
      autoComplete="off"
    >
      <h2 className="text-xl font-bold text-[var(--text)]">
        {isEditing ? "Edit Entry" : "Add New Entry"}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">Site Name *</label>
          <input
            required
            name="vault-entry-title"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl p-3 outline-none focus:border-[var(--primary)]"
            style={inputStyle}
            placeholder="e.g. GitHub"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">URL (Optional)</label>
          <input
            type="url"
            name="vault-entry-url"
            autoComplete="off"
            value={url || ""}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl p-3 outline-none focus:border-[var(--primary)]"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Username *</label>
        <input
          required
          name="vault-entry-username"
          autoComplete="off"
          value={username || ""}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl p-3 outline-none focus:border-[var(--primary)]"
          style={inputStyle}
          placeholder="e.g. devin_peters"
        />
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">Password</label>
          {password ? (
            <div
              className="flex items-center justify-between rounded-xl p-3"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-semibold text-sm">✓ New password set</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="text-xs font-bold text-[var(--primary)] uppercase hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={clearPasswordChange}
                  className="text-xs font-bold text-red-500 uppercase hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPasswordModal}
              className="w-full rounded-xl border-2 border-dashed p-3 text-sm font-semibold text-[var(--primary)] hover:opacity-80 transition"
              style={{ borderColor: "var(--border)" }}
            >
              + Change Password
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">Password *</label>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="text-[10px] font-bold text-[var(--primary)] uppercase hover:underline"
              >
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <input
                required
                name="vault-entry-password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                style={inputStyle}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--muted)]">
              Master Password * (your login password)
            </label>
            <div className="relative">
              <input
                name="vault-master-password"
                autoComplete="new-password"
                type={showMasterPassword ? "text" : "password"}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                style={inputStyle}
                placeholder="Your login password"
              />
              <button
                type="button"
                onClick={() => setShowMasterPassword(!showMasterPassword)}
                className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
              >
                {showMasterPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)]">
              Type you password.
            </p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Tags</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedTags.includes(tag)
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:opacity-80"
              }`}
              style={!selectedTags.includes(tag) ? surfaceStyle : undefined}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Notes (Optional)</label>
        <textarea
          name="vault-entry-notes"
          autoComplete="off"
          value={notes || ""}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Security questions, recovery codes..."
          className="w-full min-h-[80px] rounded-xl p-3 outline-none focus:border-[var(--primary)] resize-none"
          style={inputStyle}
        />
      </div>

      {errorMsg && (
        <div
          className="p-3 text-sm text-red-500 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? "Saving..." : isEditing ? "Update Entry" : "Save Entry"}
        </Button>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="relative w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4"
            style={surfaceStyle}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--text)]">Change Password</h2>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-[var(--muted)]">New Password *</label>
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(true)}
                  className="text-[10px] font-bold text-[var(--primary)] uppercase hover:underline"
                >
                  Generate Secure Password
                </button>
              </div>
              <div className="relative">
                <input
                  name="vault-draft-password"
                  autoComplete="new-password"
                  type={draftShowPassword ? "text" : "password"}
                  value={draftPassword}
                  onChange={(e) => setDraftPassword(e.target.value)}
                  className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                  style={inputStyle}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setDraftShowPassword(!draftShowPassword)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {draftShowPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                Master Password 
              </label>
              <div className="relative">
                <input
                  name="vault-draft-master"
                  autoComplete="new-password"
                  type={draftShowMasterPassword ? "text" : "password"}
                  value={draftMasterPassword}
                  onChange={(e) => setDraftMasterPassword(e.target.value)}
                  className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                  style={inputStyle}
                  placeholder="Your login password"
                />
                <button
                  type="button"
                  onClick={() => setDraftShowMasterPassword(!draftShowMasterPassword)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {draftShowMasterPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[10px] text-[var(--muted)]">
                Required to encrypt the new password. Verified before saving.
              </p>
            </div>

            {errorMsg && (
              <div
                className="p-3 text-sm text-red-500 rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={applyPasswordChange}
                disabled={validating}
              >
                {validating ? "Verifying..." : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isGeneratorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="relative w-full max-w-lg rounded-3xl shadow-2xl p-6"
            style={surfaceStyle}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text)]">Secure Generator</h2>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-xl"
              >
                ✕
              </button>
            </div>

            <Generator onSelect={(val) => {
              if (isPasswordModalOpen) {
                setDraftPassword(val);
                setDraftShowPassword(true);
              } else {
                setPassword(val);
                setShowPassword(true);
              }
              setIsGeneratorOpen(false);
            }} />

            <button
              type="button"
              onClick={() => setIsGeneratorOpen(false)}
              className="w-full mt-4 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] uppercase tracking-wider"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      )}
    </form>
  );
}