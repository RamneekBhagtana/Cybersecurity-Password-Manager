import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        rounded-[24px]
        bg-[var(--surface)]
        border border-[var(--border)]
        p-5
        shadow-sm
        dark:shadow-none
        ${className}
      `}
    >
      {children}
    </div>
  );
}