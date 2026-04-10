export default function Button({ children, className = "", ...props }: any) {
  return (
    <button
      className={`rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-lg shadow-[rgba(108,99,255,0.25)] transition hover:opacity-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}