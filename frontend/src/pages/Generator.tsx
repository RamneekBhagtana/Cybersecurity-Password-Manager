import { useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";

// secure random helper
function secureRandomInt(max: number) {
  if (max <= 0) return 0;

  const array = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;

  let value = 0;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

// shuffle array securely
function shuffle<T>(items: T[]) {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

//  secure password generator
function generatePassword(
  length: number,
  options: {
    upper: boolean;
    lower: boolean;
    numbers: boolean;
    special: boolean;
  }
) {
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "!@#$%^&*()_+";

  const sets = [
    options.upper ? upperChars : "",
    options.lower ? lowerChars : "",
    options.numbers ? numberChars : "",
    options.special ? specialChars : "",
  ].filter(Boolean);

  const pool =
    sets.join("") || `${upperChars}${lowerChars}${numberChars}${specialChars}`;

  const result: string[] = [];

  // ensure at least 1 char from each enabled set
  for (const set of sets) {
    result.push(set[secureRandomInt(set.length)]);
  }

  // fill remaining
  while (result.length < length) {
    result.push(pool[secureRandomInt(pool.length)]);
  }

  return shuffle(result).join("");
}

export default function Generator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSpecial, setUseSpecial] = useState(true);

  const [password, setPassword] = useState(() =>
    generatePassword(16, {
      upper: true,
      lower: true,
      numbers: true,
      special: true,
    })
  );

  const strength = useMemo(() => {
    let score =
      (useUpper ? 1 : 0) +
      (useLower ? 1 : 0) +
      (useNumbers ? 1 : 0) +
      (useSpecial ? 1 : 0);

    if (length >= 20) score += 1;

    if (score >= 5) return "Very Strong";
    if (score >= 4) return "Strong";
    if (score >= 3) return "Good";
    return "Weak";
  }, [length, useUpper, useLower, useNumbers, useSpecial]);

  const regenerate = () => {
    setPassword(
      generatePassword(length, {
        upper: useUpper,
        lower: useLower,
        numbers: useNumbers,
        special: useSpecial,
      })
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="mt-2 text-3xl font-bold">Password Generator</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create a strong password in one tap.
          </p>
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
                <Button variant="secondary" onClick={handleCopy}>
                  Copy
                </Button>
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
            <Toggle
              checked={useUpper}
              onChange={setUseUpper}
              label="Uppercase letters"
            />
            <Toggle
              checked={useLower}
              onChange={setUseLower}
              label="Lowercase letters"
            />
            <Toggle
              checked={useNumbers}
              onChange={setUseNumbers}
              label="Numbers"
            />
            <Toggle
              checked={useSpecial}
              onChange={setUseSpecial}
              label="Special characters"
            />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}