type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-sm font-medium text-[var(--text)]">
          {label}
        </span>
      ) : null}

      <input
        className={`
          w-full rounded-2xl border border-[var(--border)]
          bg-[var(--surface)]
          px-4 py-3 text-sm
          text-[var(--text)]
          placeholder:text-[var(--muted)]
          outline-none transition
          focus:border-[var(--primary)]
          focus:ring-2 focus:ring-[rgba(108,99,255,0.15)]
          ${className}
        `}
        style={{ color: "var(--text)" }}  // 🔥 ensures visibility
        {...props}
      />

      {error ? (
        <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
    </label>
  );
}