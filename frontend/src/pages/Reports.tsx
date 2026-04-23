import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { useVaultEntries } from "../hooks/useVaultEntries";

export default function Reports() {
  const navigate = useNavigate();
  const { entries } = useVaultEntries();

  // 🔹 Detect reused passwords
  const passwordMap: Record<string, any[]> = {};

  entries.forEach((entry) => {
    if (!passwordMap[entry.password]) {
      passwordMap[entry.password] = [];
    }
    passwordMap[entry.password].push(entry);
  });

  const reused = Object.values(passwordMap)
    .filter((group) => group.length > 1)
    .map((group) => ({
      count: group.length,
      entries: group,
    }));

  // 🔹 Detect weak passwords (simple rule for now)
  const weak = entries.filter((entry) => entry.password.length < 8);

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

        {/* VAULT HEALTH */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
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
                ✓
              </p>
              <p className="text-xs text-[var(--muted)]">
                Encrypted
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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-lg font-semibold">Weak Passwords</h2>

          {weak.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">All good 🎉</p>
          ) : (
            weak.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/edit/${item.id}`)}
                className="flex justify-between items-center p-3 rounded-xl bg-[var(--surface-2)] cursor-pointer hover:opacity-80"
              >
                <div>
                  <p className="font-medium">{item.site}</p>
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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-lg font-semibold">Reused Passwords</h2>

          {reused.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No reused passwords 🎉
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
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/edit/${entry.id}`)}
                    className="text-sm cursor-pointer hover:underline"
                  >
                    {entry.site} ({entry.username})
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* BREACHES (STATIC FOR NOW) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Recent Data Breaches
          </h2>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between">
              <p className="font-semibold">
                National Public Data
              </p>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                CRITICAL
              </span>
            </div>

            <p className="text-xs text-[var(--muted)] mt-1">
              Aug 2024 • 2.9 billion records
            </p>

            <p className="text-sm mt-2">
              Social Security numbers, names, and addresses leaked.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}