import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useVaultEntries } from "../hooks/useVaultEntries";

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const navigate = useNavigate();
  const { entries = [] } = useVaultEntries();

  // Load user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      const defaultName =
        data.user?.user_metadata?.name ||
        data.user?.email?.split("@")[0] ||
        "User";

      setName(defaultName);
    };
    fetchUser();
  }, []);

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const handleDarkMode = (value: boolean) => {
    setDarkMode(value);
    localStorage.setItem("darkMode", String(value));
    document.documentElement.classList.toggle("dark", value);
  };

  const handleSave = async () => {
    await supabase.auth.updateUser({
      data: { name },
    });
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // 🔥 SINGLE SOURCE OF TRUTH FOR CARDS
  const card =
    "rounded-[28px] p-6 shadow-md bg-white dark:bg-[var(--surface-2)] text-[var(--text)] transition-colors";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your account settings and preferences.
          </p>
        </div>

        {/* USER CARD */}
        <Card className={`${card} text-center`}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(108,99,255,0.15)] text-2xl font-bold text-[var(--primary)]">
            {name?.[0]?.toUpperCase()}
          </div>

          <div className="mt-4">
            {editing ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 border rounded-xl text-center w-full max-w-xs mx-auto bg-white dark:bg-[#0f172a]"
                />

                <div className="flex justify-center gap-3 mt-2">
                  <button
                    onClick={handleSave}
                    className="text-green-500 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-red-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold">{name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-[var(--primary)]"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--muted)]">
            {user?.email || "No email"}
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Member since 2026
          </p>
        </Card>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={card}>
            <p className="text-sm text-[var(--muted)]">Vault items</p>
            <p className="mt-2 text-3xl font-bold">{entries.length}</p>
          </Card>

          <Card className={card}>
            <p className="text-sm text-[var(--muted)]">Security score</p>
            <p className="mt-2 text-3xl font-bold">
              {Math.max(0, 100 - entries.length * 2)}%
            </p>
          </Card>

          <Card className={card}>
            <p className="text-sm text-[var(--muted)]">
              Protected logins
            </p>
            <p className="mt-2 text-3xl font-bold">{entries.length}</p>
          </Card>
        </div>

        {/* SETTINGS */}
        <Card className={`${card} space-y-3`}>
          <Toggle
            checked={darkMode}
            onChange={handleDarkMode}
            label="Dark mode"
          />

        </Card>

        {/* SIGN OUT */}
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </AppLayout>
  );
}