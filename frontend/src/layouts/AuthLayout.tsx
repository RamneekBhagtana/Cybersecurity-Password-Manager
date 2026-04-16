type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120f2f] via-[#25154d] to-[#0d1022] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}