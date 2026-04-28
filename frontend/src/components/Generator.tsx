import { useState } from "react";
import type { GeneratorMode, PasswordSettings, PassphraseSettings } from "../types/generator";
import zxcvbn from "zxcvbn";
import api from "../services/api";

interface GeneratorProps {
  onSelect?: (value: string) => void;
}

export default function Generator({ onSelect }: GeneratorProps) {
  const [mode, setMode] = useState<GeneratorMode>("password");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [passSettings, setPassSettings] = useState<PasswordSettings>({
    length: 12,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    min_numbers: 1,
    min_special: 1,
  });

  const [phraseSettings, setPhraseSettings] = useState<PassphraseSettings>({
    word_count: 4,
    separator: "-",
    capitalize: true,
    include_number: false,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === "password") {
        const { data } = await api.post("/generator/password", {
          length: passSettings.length,
          include_uppercase: passSettings.uppercase,
          include_lowercase: passSettings.lowercase,
          include_numbers: passSettings.numbers,
          include_special: passSettings.symbols,
          min_numbers: passSettings.min_numbers,
          min_special: passSettings.min_special,
        });
        setResult(data.password ?? "");
      } else {
        const { data } = await api.post("/generator/passphrase", {
          words: phraseSettings.word_count,
          separator: phraseSettings.separator,
          capitalize: phraseSettings.capitalize,
          include_number: phraseSettings.include_number,
        });
        setResult(data.passphrase ?? "");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate secret.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full p-6 rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex p-1 rounded-xl mb-6"
        style={{ background: "var(--surface-1)" }}
      >
        <button
          onClick={() => setMode("password")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === "password"
              ? "shadow-sm text-[var(--primary)]"
              : "text-[var(--muted)]"
          }`}
          style={
            mode === "password"
              ? { background: "var(--surface)" }
              : undefined
          }
        >
          Password
        </button>
        <button
          onClick={() => setMode("passphrase")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === "passphrase"
              ? "shadow-sm text-[var(--primary)]"
              : "text-[var(--muted)]"
          }`}
          style={
            mode === "passphrase"
              ? { background: "var(--surface)" }
              : undefined
          }
        >
          Passphrase
        </button>
      </div>

      {result && (
        <div
          className="mb-6 p-4 rounded-xl space-y-3"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold break-all text-[var(--text)]">
              {result}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="text-xs font-bold text-[var(--primary)] uppercase hover:underline ml-2"
            >
              Copy
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-[var(--muted)]">
              <span>Strength</span>
              <span>{['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][zxcvbn(result).score]}</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className={`h-full transition-all duration-500 ${
                  ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][zxcvbn(result).score]
                }`}
                style={{ width: `${(zxcvbn(result).score + 1) * 20}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {result && onSelect && (
        <button
          onClick={() => onSelect(result)}
          className="w-full mb-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
        >
          Use this Password
        </button>
      )}

      <div className="space-y-6">
        {mode === "password" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                Length: {passSettings.length}
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={passSettings.length}
                onChange={(e) => setPassSettings({ ...passSettings, length: parseInt(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                style={{ background: "var(--surface-1)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'uppercase', label: 'Uppercase' },
                { id: 'lowercase', label: 'Lowercase' },
                { id: 'numbers', label: 'Numbers' },
                { id: 'symbols', label: 'Special' },
              ].map((option) => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(passSettings as any)[option.id]}
                    onChange={(e) => setPassSettings({ ...passSettings, [option.id]: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--primary)]"
                  />
                  <span className="text-sm font-medium text-[var(--text)]">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[var(--muted)]">Min Numbers</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  disabled={!passSettings.numbers}
                  value={passSettings.min_numbers}
                  onChange={(e) => setPassSettings({ ...passSettings, min_numbers: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg text-sm text-[var(--text)] disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[var(--muted)]">Min Special</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  disabled={!passSettings.symbols}
                  value={passSettings.min_special}
                  onChange={(e) => setPassSettings({ ...passSettings, min_special: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg text-sm text-[var(--text)] disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                Words: {phraseSettings.word_count}
              </label>
              <input
                type="range"
                min="3"
                max="6"
                value={phraseSettings.word_count}
                onChange={(e) => setPhraseSettings({ ...phraseSettings, word_count: parseInt(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                style={{ background: "var(--surface-1)" }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">Separator</label>
              <input
                type="text"
                maxLength={1}
                value={phraseSettings.separator}
                onChange={(e) => setPhraseSettings({ ...phraseSettings, separator: e.target.value })}
                className="w-full p-3 rounded-xl text-sm text-[var(--text)]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
                placeholder="-"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-[var(--text)]">Capitalize Words</span>
                <input
                  type="checkbox"
                  checked={phraseSettings.capitalize}
                  onChange={(e) => setPhraseSettings({ ...phraseSettings, capitalize: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-[var(--text)]">Include Number</span>
                <input
                  type="checkbox"
                  checked={phraseSettings.include_number}
                  onChange={(e) => setPhraseSettings({ ...phraseSettings, include_number: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full mt-6 bg-[var(--primary)] text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Generating..." : (result ? "Regenerate" : "Generate Secret")}
      </button>
    </div>
  );
}