import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const items = [
  { name: "Netflix", user: "adrita@email.com", category: "Personal", dot: "bg-red-400" },
  { name: "GitHub", user: "adrita.dev", category: "Work", dot: "bg-slate-400" },
  { name: "Notion", user: "adrita.study", category: "School", dot: "bg-blue-400" },
  { name: "Discord", user: "adrita#2048", category: "Personal", dot: "bg-purple-400" },
];

export default function Vault() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              Vault
            </p>
            <h1 className="mt-2 text-3xl font-bold">My Vault</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Your saved accounts and passwords.
            </p>
          </div>
          <Button>+ Add</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Work", "Personal", "School"].map((tag, index) => (
            <button
              key={tag}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                index === 0
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white text-[var(--muted)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${item.dot}`} />
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-[var(--muted)]">{item.user}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.category}</p>
                </div>
              </div>
              <div className="text-xl text-[var(--muted)]">›</div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}