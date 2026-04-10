type CardProps = React.HTMLAttributes<HTMLDivElement>;

export default function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[28px] bg-white p-5 shadow-md shadow-slate-200/60 ${className}`}
      {...props}
    />
  );
}