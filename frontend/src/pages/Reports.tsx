import { useMemo } from "react";
import AppLayout from "../layouts/AppLayout";
import { useVaultEntries } from "../hooks/useVaultEntries";

export default function Reports() {
  const { entries = [], loading } = useVaultEntries();

  // reused passwords
  const reused = useMemo(() => {
    const map: Record<string, any[]> = {};
    entries.forEach((e) => {
      if (!map[e.password]) map[e.password] = [];
      map[e.password].push(e);
    });

    return Object.values(map)
      .filter((group) => group.length > 1)
      .map((group) => ({
        count: group.length,
        entries: group,
      }));
  }, [entries]);

  // weak passwords
  const weak = useMemo(() => {
    return entries.filter((e) => e.password.length < 8);
  }, [entries]);

  // health score
  const healthScore = Math.max(
    0,
    100 - weak.length * 10 - reused.length * 10
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Security Reports</h1>
          <p className="text-[var(--muted)] mt-1">
            Your vault health and recent public data breaches
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-sm text-[var(--muted)]">
            Loading reports...
          </p>
        )}

        {/* VAULT HEALTH */}
        <div className="rounded-[28px] bg-white dark:bg-[var(--surface-2)] p-6 shadow-md">
          <h2 className="text-lg font-semibold">Vault Health</h2>

          <div className="flex justify-between text-center">
            <div className="flex-1">
              <p className="text-2xl font-bold text-[var(--primary)]">
                {entries.length}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Total entries
              </p>
            </div>

            <div className="flex-1">
              <p className="text-2xl font-bold text-green-500">
                {healthScore}%
              </p>
              <p className="text-xs text-[var(--muted)]">
                Health score
              </p>
            </div>

            <div className="flex-1">
              <p className="text-2xl font-bold text-yellow-500">
                {weak.length}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Weak
              </p>
            </div>
          </div>
        </div>

        {/* ALERT */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          💡 If a service you use appears below, change your password immediately — especially if reused elsewhere.
        </div>

        {/* WEAK PASSWORDS */}
        <div className="rounded-[28px] bg-white dark:bg-[var(--surface-2)] p-6 shadow-md">
          <h2 className="text-lg font-semibold">Weak Passwords</h2>

          {weak.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              All clear!
            </p>
          ) : (
            weak.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-xl bg-[var(--surface-2)]"
              >
                <div>
                  <p className="font-medium">{item.siteName}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.username}
                  </p>
                </div>

                <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                  Weak
                </span>
              </div>
            ))
          )}
        </div>

        {/* REUSED PASSWORDS */}
        <div className="rounded-[28px] bg-white dark:bg-[var(--surface-2)] p-6 shadow-md">
          <h2 className="text-lg font-semibold">Reused Passwords</h2>

          {reused.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              All clear!
            </p>
          ) : (
            reused.map((group, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-[var(--surface-2)] space-y-2"
              >
                <p className="text-sm font-semibold text-yellow-600">
                  Used {group.count} times
                </p>

                {group.entries.map((entry) => (
                  <div key={entry.id} className="text-sm">
                    {entry.siteName} ({entry.username})
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* BREACHES */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Recent Data Breaches
          </h2>

          <p className="text-xs text-[var(--muted)]">
            Static demo data
          </p>

          <div className="rounded-[28px] bg-white dark:bg-[var(--surface-2)] p-6 shadow-md">
            <div className="flex justify-between">
              <p className="font-semibold">
                National Public Data
              </p>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                CRITICAL
              </span>
            </div>

            <p className="text-xs text-[var(--muted)] mt-1">
              Aug 2024 • 2.9B records
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}