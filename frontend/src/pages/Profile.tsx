import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useVaultEntries } from "../hooks/useVaultEntries";
import { useMasterPassword } from "../context/MasterPasswordContext";

const AVATARS = [
  "🐶","🐱","🦊","🐼","🐨","🐸",
  "🐵","🐧","🦄","🐰","🐯","🐷",
  "⚽","🏀","🚲","🐦","🧀","🏈",
  "🍣","🍉","🍦","🍕","🥑","🎧"
];

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const navigate = useNavigate();
  const { entries = [], reusedCount } = useVaultEntries();
  const { setMasterPassword } = useMasterPassword();

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

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("avatar");
    if (savedAvatar) setSelectedAvatar(savedAvatar);
  }, []);

  const handleDarkMode = (value: boolean) => {
    setDarkMode(value);
    localStorage.setItem("darkMode", String(value));
    document.documentElement.classList.toggle("dark", value);
  };

  const handleSave = async () => {
    await supabase.auth.updateUser({ data: { name } });
    setEditing(false);
  };

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    localStorage.setItem("avatar", avatar);
    setShowAvatarPicker(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMasterPassword(null);
    navigate("/login");
  };

  const weakPasswords = entries.filter(
    (e) => e.password_strength != null && e.password_strength <= 2
  ).length;

  const securityScore = Math.max(
    0,
    100 - weakPasswords * 10 - reusedCount * 10
  );

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
        <Card className="text-center p-8">
          {/* Avatar with edit */}
          <div className="mx-auto relative w-20 h-20">
            <div
              onClick={() => setShowAvatarPicker(true)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(108,99,255,0.15)] text-3xl cursor-pointer hover:scale-105 transition"
            >
              {selectedAvatar ? selectedAvatar : name?.[0]?.toUpperCase()}
            </div>

            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 bg-[var(--primary)] text-white rounded-full p-1.5 text-xs shadow hover:scale-110 transition"
            >
              ✏️
            </button>
          </div>

          <div className="mt-4">
            {editing ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 border border-[var(--border)] rounded-xl text-center w-full max-w-xs mx-auto bg-[var(--surface)] text-[var(--text)]"
                />
                <div className="flex justify-center gap-3 mt-2">
                  <button onClick={handleSave} className="text-green-500 text-sm font-semibold">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="text-red-500 text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold">{name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--muted)] mt-1">{user?.email || "No email"}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Member since 2026</p>
        </Card>

        {/* AVATAR MODAL */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--surface)] rounded-2xl p-6 w-[320px]">
              <h2 className="text-lg font-semibold mb-4 text-center">
                Choose Avatar
              </h2>

              <div className="grid grid-cols-6 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`h-12 w-12 flex items-center justify-center rounded-full text-xl transition
                      ${selectedAvatar === avatar
                        ? "ring-2 ring-[var(--primary)] scale-110"
                        : "hover:scale-105 bg-[var(--surface)]"
                      }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAvatarPicker(false)}
                className="mt-4 w-full text-sm text-[var(--muted)] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-[var(--muted)]">Vault items</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">
              {entries.length}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Security score</p>
            <p className="mt-2 text-3xl font-bold text-green-500">
              {securityScore}%
            </p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Protected logins</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">
              {entries.length}
            </p>
          </Card>
        </div>

        {/* SETTINGS */}
        <Card className="space-y-3">
          <Toggle checked={darkMode} onChange={handleDarkMode} label="Dark mode" />
        </Card>

        {/* SIGN OUT */}
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-600 hover:underline transition px-4 py-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}