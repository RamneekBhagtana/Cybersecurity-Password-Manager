import { useState } from "react";
import Generator from "../components/Generator";
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
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  const [tagInput, setTagInput] = useState(() => {
    if (!initialData?.tag) return "";
    return Array.isArray(initialData.tag) ? initialData.tag.join(", ") : "";
  });

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
      setErrorMsg(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left relative">
      <h2 className="text-xl font-bold text-black">
        {initialData ? "Edit Entry" : "Add New Entry"}
      </h2>

      {/* Row 1: Site Name and URL */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-400">Site Name *</label>
          <input
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
            placeholder="e.g. GitHub"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-400">URL (Optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Row 2: Username */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-gray-400">Username *</label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
          placeholder="e.g. devin_peters"
        />
      </div>

      {/* Row 3: Password with Generator Bridge */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase text-gray-400">Password *</label>
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
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

      {/* Row 4: Tags */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-gray-400">Tags (Comma Separated)</label>
        <input
          placeholder="Work, Personal, School"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)]"
        />
      </div>

      {/* Row 5: Notes */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-gray-400">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Security questions, recovery codes..."
          className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-black outline-none focus:border-[var(--primary)] resize-none"
        />
      </div>
    
      {errorMsg && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? "Update Entry" : "Save Entry"}
        </Button>
      </div>

      {/* T24 MODAL OVERLAY */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Secure Generator</h2>
              <button 
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <Generator onSelect={(val) => {
              setPassword(val);
              setIsGeneratorOpen(false);
              setShowPassword(true); // Automatically show it so the user sees what was selected
            }} />
            
            <button 
              type="button"
              onClick={() => setIsGeneratorOpen(false)}
              className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      )}
    </form>
  );
}