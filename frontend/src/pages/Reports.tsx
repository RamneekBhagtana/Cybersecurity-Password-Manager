import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-bold">Security Reports</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Summary of security checks and improvements.
          </p>
        </div>

        <Card>
          <p className="text-sm text-[var(--muted)]">No reports yet.</p>
          <p className="mt-2 text-sm">
            
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}