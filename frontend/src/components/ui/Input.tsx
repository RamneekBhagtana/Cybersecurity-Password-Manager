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
        className={`w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(108,99,255,0.15)] ${className}`}
        {...props}
      />
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </label>
  );
}