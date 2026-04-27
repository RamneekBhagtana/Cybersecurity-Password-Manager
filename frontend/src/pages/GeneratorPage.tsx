import AppLayout from "../layouts/AppLayout";
import Generator from "../components/Generator";

export default function GeneratorPage() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Generator</h1>
          <p className="text-[var(--muted)] mt-1">
            Create strong passwords or passphrases instantly
          </p>
        </div>

        {/* GENERATOR CARD */}
        <div
          className="rounded-[28px] p-6"
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Generator />
        </div>
      </div>
    </AppLayout>
  );
}