import { useCallback, useState } from "react";

const SENT_KEY = "ofs_sent";
const RECEIVED_KEY = "ofs_received";

export interface HistoryRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  peerName: string;
  timestamp: number;
}

function loadRecords(key: string): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(key: string, records: HistoryRecord[]): void {
  localStorage.setItem(key, JSON.stringify(records));
}

export function useLocalHistory() {
  const [sentFiles, setSentFiles] = useState<HistoryRecord[]>(() =>
    loadRecords(SENT_KEY),
  );
  const [receivedFiles, setReceivedFiles] = useState<HistoryRecord[]>(() =>
    loadRecords(RECEIVED_KEY),
  );

  const addSent = useCallback((record: HistoryRecord) => {
    setSentFiles((prev) => {
      const next = [record, ...prev];
      saveRecords(SENT_KEY, next);
      return next;
    });
  }, []);

  const addReceived = useCallback((record: HistoryRecord) => {
    setReceivedFiles((prev) => {
      const next = [record, ...prev];
      saveRecords(RECEIVED_KEY, next);
      return next;
    });
  }, []);

  const deleteSent = useCallback((id: string) => {
    setSentFiles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRecords(SENT_KEY, next);
      return next;
    });
  }, []);

  const deleteReceived = useCallback((id: string) => {
    setReceivedFiles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRecords(RECEIVED_KEY, next);
      return next;
    });
  }, []);

  return {
    sentFiles,
    receivedFiles,
    addSent,
    addReceived,
    deleteSent,
    deleteReceived,
  };
}
