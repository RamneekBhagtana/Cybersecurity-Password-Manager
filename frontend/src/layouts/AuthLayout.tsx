export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-[var(--bg)]
        transition-colors
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-[28px]
          p-6
          bg-[var(--surface)]
          border border-[var(--border)]
          shadow-sm
          dark:shadow-none
          text-[var(--text)]
        "
      >
        {children}
      </div>
    </div>
  );
}