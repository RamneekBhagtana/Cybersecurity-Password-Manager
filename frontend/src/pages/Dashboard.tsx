import { Link } from "react-router-dom";

export default function Dashboard() {
  const stats = [
    { label: "Saved passwords", value: "24" },
    { label: "Strong passwords", value: "18" },
    { label: "Security score", value: "92%" },
  ];

  const quickLinks = [
    { label: "Vault", to: "/vault" },
    { label: "Generator", to: "/generator" },
    { label: "Profile", to: "/profile" },
  ];

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-br from-[#120f2f] via-[#25154d] to-[#0d1022] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Keep track of your vault, generate strong passwords, and manage your account from one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] bg-white p-5 shadow-md shadow-slate-200/60"
            >
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-[28px] bg-white p-5 shadow-md shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="text-sm text-[var(--muted)]">Quick action</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                {item.label}
              </p>
              <p className="mt-3 text-sm text-[var(--primary)]">Open →</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-md shadow-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Recent activity</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Your latest vault actions.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Added GitHub account",
                "Updated Netflix password",
                "Generated a new work password",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-[var(--surface-2)] px-4 py-3"
                >
                  <span className="text-sm font-medium">{item}</span>
                  <span className="text-sm text-[var(--muted)]">Today</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-md shadow-slate-200/60">
            <h2 className="text-xl font-bold">Security status</h2>
            <div className="mt-4 rounded-[24px] bg-[rgba(108,99,255,0.08)] p-4">
              <p className="text-sm text-[var(--muted)]">Overall score</p>
              <p className="mt-1 text-4xl font-bold text-[var(--primary)]">92%</p>
              <p className="mt-2 text-sm text-[var(--text)]">
                Your vault is in good shape. Keep using strong passwords.
              </p>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Weak passwords</span>
                <span className="font-semibold text-[var(--danger)]">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2FA enabled</span>
                <span className="font-semibold text-[var(--success)]">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vault synced</span>
                <span className="font-semibold text-[var(--success)]">Yes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}