import { useState } from "react";
import Button from "./ui/Button";
import { supabase } from "../lib/supabase";
import type { VaultEntry } from "../types/vault";

interface VaultFormProps {
  initialData?: VaultEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VaultForm({ initialData, onSuccess, onCancel }: VaultFormProps) {
  const [siteName, setSiteName] = useState(initialData?.siteName || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialData?.notes || "");
  
  const [tagInput, setTagInput] = useState(() => {
    if (!initialData?.tag) return "";
    return Array.isArray(initialData.tag) ? initialData.tag.join(", ") : "";
  });

  // T24 Bridge: Simple generator function
  const handleGenerate = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const generated = Array.from(crypto.getRandomValues(new Uint32Array(16)))
      .map((x) => charset[x % charset.length])
      .join("");
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const tagsArray = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("vault").upsert({
      id: initialData?.id, 
      siteName,
      website,
      username,
      password,
      notes,
      tag: tagsArray, 
      user_id: user?.id,
    });
    
    if (!error) {
      alert(initialData ? "Entry updated successfully!" : "New entry added successfully!");
      onSuccess();
    } else {
      setErrorMsg(error.message); // Updated to show inline
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <h2 className="text-xl font-bold">{initialData ? "Edit Entry" : "Add New Entry"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">Site Name *</label>
          <input
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">URL (Optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Username *</label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase text-[var(--muted)]">Password *</label>
          {/* T24 Requirement: Generate Button */}
          <button 
            type="button" 
            onClick={handleGenerate}
            className="text-[10px] font-bold text-[var(--primary)] uppercase hover:underline"
          >
            Generate
          </button>
        </div>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
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
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Tags (Comma Separated)</label>
        <input
          placeholder="Work, Personal, School"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-[var(--muted)]">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Security questions, recovery codes..."
          className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)] resize-none"
        />
      </div>
    
      {errorMsg && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}