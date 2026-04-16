import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input label="Email" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
        <Input label="Password" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button className="w-full">Login</Button>
      </form>

      <p className="mt-4 text-sm text-center">
        No account?{" "}
        <Link to="/register" className="text-[var(--primary)]">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}