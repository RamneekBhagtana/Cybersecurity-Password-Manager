import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";

type Props = {
  children: React.ReactNode;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? "bg-[rgba(108,99,255,0.12)] text-[var(--primary)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
  }`;

export default function AppLayout({ children }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">

      {/* HEADER */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-lg font-bold">
            SecureVault
          </Link>

          <Button variant="secondary" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">

        {/* SIDEBAR */}
        <aside className="rounded-[28px] bg-white dark:bg-[var(--surface-2)] p-4 shadow-md transition-colors">
          <nav className="space-y-2">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/vault" className={navLinkClass}>
              Vault
            </NavLink>
            <NavLink to="/generator" className={navLinkClass}>
              Generator
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              Reports
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="space-y-6">
          {children} 
        </main>

      </div>
    </div>
  );
}


