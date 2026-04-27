import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { useVaultEntries } from "../hooks/useVaultEntries";

const BREACHES = [
  {
    name: "National Public Data",
    date: "Aug 2024",
    records: "2.9 billion records",
    severity: "CRITICAL",
    description: "Social Security numbers, names, addresses, and phone numbers leaked from a background-check data broker.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/national-public-data-confirms-breach-exposing-social-security-numbers/",
  },
  {
    name: "Ticketmaster / Live Nation",
    date: "May 2024",
    records: "560 million records",
    severity: "HIGH",
    description: "Customer names, addresses, phone numbers, and partial payment card data exposed by the ShinyHunters group.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/ticketmaster-confirms-massive-breach-after-stolen-data-for-sale-online/",
  },
  {
    name: "AT&T",
    date: "Jul 2024",
    records: "110 million records",
    severity: "HIGH",
    description: "Call and text metadata for nearly all AT&T wireless customers exposed from a third-party cloud platform.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/massive-atandt-data-breach-exposes-call-logs-of-109-million-customers/",
  },
  {
    name: "Dell",
    date: "May 2024",
    records: "49 million records",
    severity: "MEDIUM",
    description: "Customer order data including names, physical addresses, and Dell hardware details posted to a hacking forum.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/dell-api-abused-to-steal-49-million-customer-records-in-data-breach/",
  },
  {
    name: "Change Healthcare",
    date: "Feb 2024",
    records: "100 million+ records",
    severity: "CRITICAL",
    description: "Largest healthcare data breach in US history. Patient records, insurance details, and medical histories exposed.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/unitedhealth-says-data-of-100-million-stolen-in-change-healthcare-breach/",
  },
  {
    name: "Trello",
    date: "Jan 2024",
    records: "15 million records",
    severity: "MEDIUM",
    description: "Email addresses scraped via public API and combined with profile data, then published on a hacking forum.",
    learnMoreUrl: "https://www.bleepingcomputer.com/news/security/trello-api-abused-to-link-email-addresses-to-15-million-accounts/",
  },
];

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
};

export default function Reports() {
  const { entries = [], reusedCount, loading, error, reload } = useVaultEntries();
  const navigate = useNavigate();

  const weak = useMemo(
    () => entries.filter((e) => e.password_strength != null && e.password_strength <= 2),
    [entries]
  );
  const reused = useMemo(() => entries.filter((e) => e.is_reused), [entries]);
  const healthScore = Math.max(0, 100 - weak.length * 10 - reusedCount * 10);

  const goToEdit = (id: string) => navigate("/vault", { state: { editEntryId: id } });

  const cardStyle = {
    background: "var(--gradient-card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-soft)",
  };
  const rowStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        <div>
          <h1 className="text-3xl font-bold">Security Reports</h1>
          <p className="text-[var(--muted)] mt-1">Your vault health and recent public data breaches</p>
        </div>

        {loading && <p className="text-sm text-[var(--muted)]">Loading reports...</p>}

        {error && (
          <div className="flex items-center justify-between rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={reload} className="text-sm font-semibold text-red-700 dark:text-red-300 hover:underline">Retry</button>
          </div>
        )}

        <div className="rounded-[28px] p-6" style={cardStyle}>
          <h2 className="text-lg font-semibold mb-4">Vault Health</h2>
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <p className="text-2xl font-bold text-[var(--primary)]">{entries.length}</p>
              <p className="text-xs text-[var(--muted)]">Total entries</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-green-500">{healthScore}%</p>
              <p className="text-xs text-[var(--muted)]">Health score</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-yellow-500">{weak.length}</p>
              <p className="text-xs text-[var(--muted)]">Weak</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl p-4 text-sm shadow-sm"
              style={{
                background: "#fdf6e3",
                border: "1px solid #ecd9a0",
                color: "#8b6914",
                  }}
>
  <span className="text-lg">💡</span>
  <p>If a service you use appears below , change your password immediately — especially if reused elsewhere.</p>
</div>

        <div className="rounded-[28px] p-6 space-y-3" style={cardStyle}>
          <h2 className="text-lg font-semibold">Weak Passwords</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">All clear!</p>
          ) : (
            weak.map((item) => (
              <button key={item.entry_id} onClick={() => goToEdit(item.entry_id)} className="w-full flex justify-between items-center p-3 rounded-xl transition text-left hover:opacity-80" style={rowStyle}>
                <div>
                  <p className="font-medium text-[var(--text)]">{item.title}</p>
                  <p className="text-xs text-[var(--muted)]">{item.username}</p>
                </div>
                <span
                  className="text-xs font-bold uppercase px-2 py-1 rounded-full"
                  style={{ background: "#ef4444", color: "white" }}
                >
                  Weak
                </span>
              </button>
            ))
          )}
        </div>

        <div className="rounded-[28px] p-6 space-y-3" style={cardStyle}>
          <h2 className="text-lg font-semibold">Reused Passwords</h2>
          {reused.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">All clear!</p>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)]">{reused.length} entries share a password with at least one other entry.</p>
              {reused.map((item) => (
                <button key={item.entry_id} onClick={() => goToEdit(item.entry_id)} className="w-full flex justify-between items-center p-3 rounded-xl transition text-left hover:opacity-80" style={rowStyle}>
                  <div>
                    <p className="font-medium text-[var(--text)]">{item.title}</p>
                    <p className="text-xs text-[var(--muted)]">{item.username}</p>
                  </div>
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded-full"
                    style={{ background: "#eab308", color: "white" }}
                  >
                    Reused
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Data Breaches</h2>
          <div className="space-y-3">
            {BREACHES.map((breach) => (
              <div key={breach.name} className="rounded-[28px] p-5 space-y-2" style={cardStyle}>
                <div className="flex justify-between items-start gap-3">
                  <p className="font-semibold text-[var(--text)] flex-1">{breach.name}</p>
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: SEVERITY_BG[breach.severity], color: "white" }}
                  >
                    {breach.severity}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">{breach.date} • {breach.records}</p>
                <p className="text-sm text-[var(--text)] opacity-90 leading-relaxed">{breach.description}</p>
                <a href={breach.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-bold text-[var(--primary)] uppercase hover:underline pt-1">Learn more</a>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] p-6 space-y-3" style={cardStyle}>
          <h2 className="text-lg font-semibold">Check Your Email</h2>
          <p className="text-sm text-[var(--text)] opacity-90 leading-relaxed">
            Visit <a href="https://haveibeenpwned.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] font-semibold hover:underline">haveibeenpwned.com</a> to check if any of your email addresses have appeared in a known data breach.
          </p>
          <a href="https://haveibeenpwned.com" target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-bold text-[var(--primary)] uppercase hover:underline pt-1">Check now</a>
        </div>
      </div>
    </AppLayout>
  );
}