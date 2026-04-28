import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useVaultEntries } from "../hooks/useVaultEntries";
import { useMasterPassword } from "../context/MasterPasswordContext";
import {
  fetchVaultEntries,
  fetchVaultEntryDetail,
  updateVaultEntry,
  deleteVaultEntry,
} from "../services/vault";

const AVATARS = [
  "🐶", "🐱", "🦊", "🐼", "🐨", "🐸",
  "🐵", "🐧", "🦄", "🐰", "🐯", "🐷",
  "⚽", "🏀", "🚲", "🐦", "🧀", "🏈",
  "🍣", "🍉", "🍦", "🍕", "🥑", "🎧",
];

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwProgress, setPwProgress] = useState<string>("");

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

  const openPwModal = () => {
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setPwError(null);
    setPwSuccess(null);
    setPwProgress("");
    setPwModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    setPwProgress("");

    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    if (currentPw === newPw) {
      setPwError("New password must be different from current password.");
      return;
    }
    if (!user?.email) {
      setPwError("Could not determine your email. Try refreshing the page.");
      return;
    }

    setPwSubmitting(true);

    // Verify current password
    setPwProgress("Verifying current password...");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    });
    if (signInError) {
      setPwSubmitting(false);
      setPwProgress("");
      setPwError("Current password is incorrect.");
      return;
    }

    // Re-encrypt every vault entry with the new master password.
    // If an entry can't be decrypted (broken from earlier testing), delete it
    // so the vault stays consistent with the current login password.
    let reencrypted = 0;
    let removed = 0;
    try {
      const list = await fetchVaultEntries();
      const total = list.entries.length;
      for (let i = 0; i < total; i++) {
        const entry = list.entries[i];
        setPwProgress(`Re-encrypting vault entry ${i + 1} of ${total}...`);
        try {
          const detail = await fetchVaultEntryDetail(entry.entry_id, currentPw);
          await updateVaultEntry(entry.entry_id, {
            password: detail.password,
            master_password: newPw,
          });
          reencrypted++;
        } catch {
          try {
            await deleteVaultEntry(entry.entry_id);
            removed++;
          } catch {
            // ignore — entry stays in DB but is unrecoverable
          }
        }
      }
    } catch (err: any) {
      setPwSubmitting(false);
      setPwProgress("");
      setPwError("Your account password was NOT changed. Please try again.");
      return;
    }

    // Update Supabase auth password
    setPwProgress("Updating account password...");
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPw,
    });
    if (updateError) {
      setPwSubmitting(false);
      setPwProgress("");
      setPwError("Failed to update account password: " + updateError.message);
      return;
    }

    // Sync master password context
    setMasterPassword(newPw);

    setPwSubmitting(false);
    setPwProgress("");
    if (removed > 0) {
      setPwSuccess(
        `Password changed successfully. ${reencrypted} entries re-encrypted, ${removed} unrecoverable entries removed.`
      );
    } else {
      setPwSuccess("Password changed successfully.");
    }
    setTimeout(() => setPwModalOpen(false), 1500);
  };

  const weakPasswords = entries.filter(
    (e) => e.password_strength != null && e.password_strength <= 2
  ).length;
  const securityScore = Math.max(
    0,
    100 - weakPasswords * 10 - reusedCount * 10
  );

  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">
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
                  className="px-3 py-2 rounded-xl text-center w-full max-w-xs mx-auto"
                  style={inputStyle}
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

        {/* AVATAR PICKER MODAL */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-lg font-semibold mb-4 text-center text-[var(--text)]">
                Choose Avatar
              </h2>
              <div className="grid grid-cols-6 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`h-12 w-12 flex items-center justify-center rounded-full text-xl transition ${
                      selectedAvatar === avatar
                        ? "ring-2 ring-[var(--primary)] scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ background: "var(--surface-1)" }}
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-[var(--muted)]">Vault items</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">{entries.length}</p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Security score</p>
            <p className="mt-2 text-3xl font-bold text-green-500">{securityScore}%</p>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Protected logins</p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">{entries.length}</p>
          </Card>
        </div>

        <Card className="space-y-3">
          <Toggle checked={darkMode} onChange={handleDarkMode} label="Dark mode" />
        </Card>

        <Card>
          <button
            onClick={openPwModal}
            className="w-full flex items-center justify-between p-2 transition hover:opacity-80"
          >
            <div className="text-left">
              <p className="font-semibold text-[var(--text)]">Change Password</p>
              <p className="text-xs text-[var(--muted)]">
                Update your SecureVault account password
              </p>
            </div>
            <span className="text-[var(--primary)] text-xl">→</span>
          </button>
        </Card>

        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-600 hover:underline transition px-4 py-2"
          >
            Sign out
          </button>
        </div>
      </div>

      {pwModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleChangePassword}
            className="relative w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Change Password</h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Update your account password
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-xl"
                disabled={pwSubmitting}
              >
                ✕
              </button>
            </div>

            <div
              className="flex items-start gap-3 rounded-xl p-3 text-xs"
              style={{
                background: "rgba(108,99,255,0.1)",
                border: "1px solid rgba(108,99,255,0.3)",
                color: "var(--text)",
              }}
            >
              <span>ℹ️</span>
              <p>
                This changes your SecureVault account password. Make sure to use a
                strong, unique password.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                Current Password
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                  style={inputStyle}
                  disabled={pwSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                  style={inputStyle}
                  disabled={pwSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="new-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl p-3 pr-16 outline-none focus:border-[var(--primary)]"
                  style={inputStyle}
                  disabled={pwSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-xs font-medium text-[var(--primary)]"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {pwProgress && (
              <div
                className="p-3 text-sm rounded-xl"
                style={{
                  background: "rgba(108,99,255,0.1)",
                  border: "1px solid rgba(108,99,255,0.3)",
                  color: "var(--primary)",
                }}
              >
                {pwProgress}
              </div>
            )}

            {pwError && (
              <div
                className="p-3 text-sm text-red-500 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                {pwError}
              </div>
            )}

            {pwSuccess && (
              <div
                className="p-3 text-sm text-green-600 rounded-xl"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                {pwSuccess}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pwSubmitting}>
              {pwSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}