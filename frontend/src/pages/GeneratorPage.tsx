import AppLayout from "../layouts/AppLayout";
import Generator from "../components/Generator";

export default function GeneratorPage() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto px-4">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Generator</h1>
          <p className="text-[var(--muted)] mt-1">
            Create strong passwords or passphrases instantly
          </p>
        </div>

        {/* Generator */}
        <Generator />

      </div>
    </AppLayout>
  );
}