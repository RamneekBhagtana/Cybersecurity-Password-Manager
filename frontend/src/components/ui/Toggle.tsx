type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
};

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        checked
          ? "border-[var(--primary)] bg-[rgba(108,99,255,0.08)]"
          : "border-[var(--border)] bg-white"
      }`}
    >
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <span
        className={`h-6 w-11 rounded-full p-1 transition ${
          checked ? "bg-[var(--primary)]" : "bg-slate-300"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}