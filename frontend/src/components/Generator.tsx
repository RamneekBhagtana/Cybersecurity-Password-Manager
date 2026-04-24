import { useState } from "react";
import type { GeneratorMode, PasswordSettings, PassphraseSettings } from "../types/generator";
import zxcvbn from "zxcvbn";

interface GeneratorProps {
  onSelect?: (value: string) => void;
}

// 2. UPDATE: Accept the onSelect prop in the function signature
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
    const endpoint =
      mode === "password"
        ? "http://localhost:5000/generator/password"
        : "http://localhost:5000/generator/passphrase";

    const body =
      mode === "password"
        ? {
            length: passSettings.length,
            include_uppercase: passSettings.uppercase,
            include_lowercase: passSettings.lowercase,
            include_numbers: passSettings.numbers,
            include_special: passSettings.symbols, // ✅ FIX HERE
            min_numbers: passSettings.min_numbers,
            min_special: passSettings.min_special,
          }
        : {
            words: phraseSettings.word_count,
            separator: phraseSettings.separator,
            capitalize: phraseSettings.capitalize,
            include_number: phraseSettings.include_number,
          };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    setResult(data.password || data.passphrase);
  } catch (err) {
    console.error(err);
    alert("Failed to generate secret.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* 1. Mode Toggle */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <button
          onClick={() => setMode("password")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === "password" ? "bg-white shadow-sm text-[var(--primary)]" : "text-gray-500"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setMode("passphrase")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === "passphrase" ? "bg-white shadow-sm text-[var(--primary)]" : "text-gray-500"
          }`}
        >
          Passphrase
        </button>
      </div>

      {/* Result Display & Strength Meter */}
      {result && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold break-all text-black">{result}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(result)}
              className="text-xs font-bold text-[var(--primary)] uppercase hover:underline ml-2"
            >
              Copy
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
              <span>Strength</span>
              <span>{['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][zxcvbn(result).score]}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
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

      {/* 3. ADD: "Use this Password" button (Only visible when embedded) */}
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
            {/* Length Slider */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Length: {passSettings.length}</label>
              <input
                type="range"
                min="8"
                max="24"
                value={passSettings.length}
                onChange={(e) => setPassSettings({ ...passSettings, length: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Checkboxes */}
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
                    className="w-4 h-4 rounded border-gray-300 text-[var(--primary)]"
                  />
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Min Constraints */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Min Numbers</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  disabled={!passSettings.numbers}
                  value={passSettings.min_numbers}
                  onChange={(e) => setPassSettings({ ...passSettings, min_numbers: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm text-black disabled:bg-gray-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Min Special</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  disabled={!passSettings.symbols}
                  value={passSettings.min_special}
                  onChange={(e) => setPassSettings({ ...passSettings, min_special: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm text-black disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Word Count Slider */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Words: {phraseSettings.word_count}</label>
              <input
                type="range"
                min="3"
                max="6"
                value={phraseSettings.word_count}
                onChange={(e) => setPhraseSettings({ ...phraseSettings, word_count: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Separator */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Separator</label>
              <input
                type="text"
                maxLength={1}
                value={phraseSettings.separator}
                onChange={(e) => setPhraseSettings({ ...phraseSettings, separator: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm text-black"
                placeholder="-"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Capitalize Words</span>
                <input
                  type="checkbox"
                  checked={phraseSettings.capitalize}
                  onChange={(e) => setPhraseSettings({ ...phraseSettings, capitalize: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Include Number</span>
                <input
                  type="checkbox"
                  checked={phraseSettings.include_number}
                  onChange={(e) => setPhraseSettings({ ...phraseSettings, include_number: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
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
