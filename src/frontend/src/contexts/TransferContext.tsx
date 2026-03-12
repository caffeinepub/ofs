import { type ReactNode, createContext, useContext, useState } from "react";

interface TransferContextValue {
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
  clearPendingFile: () => void;
}

const TransferContext = createContext<TransferContextValue | null>(null);

export function TransferProvider({ children }: { children: ReactNode }) {
  const [pendingFile, setPendingFileState] = useState<File | null>(null);

  const setPendingFile = (file: File | null) => setPendingFileState(file);
  const clearPendingFile = () => setPendingFileState(null);

  return (
    <TransferContext.Provider
      value={{ pendingFile, setPendingFile, clearPendingFile }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer(): TransferContextValue {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used inside TransferProvider");
  return ctx;
}
