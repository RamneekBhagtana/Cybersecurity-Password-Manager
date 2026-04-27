import { createContext, useContext, useState, type ReactNode } from "react";

type MasterPasswordContextType = {
  masterPassword: string | null;
  setMasterPassword: (password: string | null) => void;
};

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

export function MasterPasswordProvider({ children }: { children: ReactNode }) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  return (
    <MasterPasswordContext.Provider value={{ masterPassword, setMasterPassword }}>
      {children}
    </MasterPasswordContext.Provider>
  );
}

export function useMasterPassword() {
  const ctx = useContext(MasterPasswordContext);
  if (!ctx) throw new Error("useMasterPassword must be used within MasterPasswordProvider");
  return ctx;
}