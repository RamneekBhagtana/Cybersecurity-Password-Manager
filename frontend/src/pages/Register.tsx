import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e:any) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.signUp({
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
      <h1 className="text-2xl font-bold mb-6">Register</h1>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input label="Email" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
        <Input label="Password" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} />
        <Input label="Confirm Password" type="password" value={confirm} onChange={(e:any)=>setConfirm(e.target.value)} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button className="w-full">Create account</Button>
      </form>

      <p className="mt-4 text-sm text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-[var(--primary)]">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}