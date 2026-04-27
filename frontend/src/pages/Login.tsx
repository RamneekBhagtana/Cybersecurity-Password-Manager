import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useMasterPassword } from "../context/MasterPasswordContext";

export default function Login() {
  const navigate = useNavigate();
  const { setMasterPassword } = useMasterPassword();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email)) return setError("Invalid email.");
    if (!password) return setError("Enter password.");

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) return setError(error.message);

    // Capture the login password — used as master password for vault encryption.
    setMasterPassword(password);

    navigate("/dashboard", { replace: true });
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) return setError("Enter email first.");

    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResetting(false);

    if (error) return setError(error.message);
    setMessage("Check your email for reset link.");
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-[28px] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm dark:shadow-none">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Sign in</h1>
          <p className="mb-6 text-sm text-[var(--muted)]">Access your vault securely.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              {resetting ? "Sending..." : "Forgot password?"}
            </button>

            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            {message && <p className="text-sm text-[var(--success)]">{message}</p>}

            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            No account?{" "}
            <Link to="/register" className="text-[var(--primary)] font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}