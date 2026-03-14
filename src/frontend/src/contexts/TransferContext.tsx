import { createContext, useContext, useState } from "react";

interface TransferContextValue {
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
}

const TransferContext = createContext<TransferContextValue>({
  pendingFile: null,
  setPendingFile: () => {},
});

export function TransferProvider({ children }: { children: React.ReactNode }) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  return (
    <TransferContext.Provider value={{ pendingFile, setPendingFile }}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  return useContext(TransferContext);
}
