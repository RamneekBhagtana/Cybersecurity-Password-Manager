import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="mt-2 text-3xl font-bold">Account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your account settings and preferences.
          </p>
        </div>

        <Card className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(108,99,255,0.12)] text-2xl font-bold text-[var(--primary)]">
            A
          </div>
          <h2 className="mt-4 text-xl font-bold">Adrita</h2>
          <p className="text-sm text-[var(--muted)]">adrita@email.com</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Member since April 2026</p>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-[var(--muted)]">Vault items</p>
            <p className="mt-2 text-3xl font-bold">24</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)]">Security score</p>
            <p className="mt-2 text-3xl font-bold">92%</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)]">Protected logins</p>
            <p className="mt-2 text-3xl font-bold">18</p>
          </Card>
        </div>

        <Card className="space-y-3">
          <Toggle checked={darkMode} onChange={setDarkMode} label="Dark mode" />
          <button className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-left text-sm font-medium">
            Change password
          </button>
          <button className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-left text-sm font-medium">
            Security reports
          </button>
          <button className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-left text-sm font-medium">
            About
          </button>
        </Card>

        <Button variant="danger" className="w-full">
          Sign out
        </Button>
      </div>
    </AppLayout>
  );
}