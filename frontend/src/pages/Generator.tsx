import { useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";

function generatePassword(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function Generator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSpecial, setUseSpecial] = useState(true);
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [password, setPassword] = useState(() => generatePassword(16));

  const strength = useMemo(() => {
    if (password.length >= 20) return "Strong";
    if (password.length >= 12) return "Good";
    return "Weak";
  }, [password]);

  const regenerate = () => {
    setPassword(generatePassword(length));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
            Generator
          </p>
          <h1 className="mt-2 text-3xl font-bold">Password Generator</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create a strong password in one tap.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("password")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === "password"
                ? "bg-[var(--primary)] text-white"
                : "bg-white text-[var(--muted)]"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setMode("passphrase")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === "passphrase"
                ? "bg-[var(--primary)] text-white"
                : "bg-white text-[var(--muted)]"
            }`}
          >
            Passphrase
          </button>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="rounded-[24px] bg-[var(--surface-2)] p-4">
              <p className="break-all text-lg font-semibold">{password}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Strength</p>
                <p className="font-semibold">{strength}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">Copy</Button>
                <Button onClick={regenerate}>New</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Length</p>
              <p className="text-sm text-[var(--muted)]">{length}</p>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>

          <div className="grid gap-3">
            <Toggle checked={useUpper} onChange={setUseUpper} label="Uppercase letters" />
            <Toggle checked={useLower} onChange={setUseLower} label="Lowercase letters" />
            <Toggle checked={useNumbers} onChange={setUseNumbers} label="Numbers" />
            <Toggle checked={useSpecial} onChange={setUseSpecial} label="Special characters" />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}