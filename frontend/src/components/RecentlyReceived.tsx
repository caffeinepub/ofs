import React, { useState, useCallback } from 'react';
import { Download, FileText, Image, Film, Music, Archive } from 'lucide-react';
import { useGetTransferHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { TransferRecordData } from '../backend';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import {
  formatFileSize,
  formatTimestamp,
  filterReceivedTransfers,
} from '../utils/receivedDownloads';

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Film;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('tar')) return Archive;
  return FileText;
}

interface FileItemProps {
  record: TransferRecordData;
}

function FileItem({ record }: FileItemProps) {
  const [downloading, setDownloading] = useState(false);
  const FileIcon = getFileIcon(record.file.fileType);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadTransferFile(record.file.blob, record.file.name, record.file.fileType);
    } finally {
      setDownloading(false);
    }
  }, [record.file, downloading]);

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
      {/* File icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileIcon size={20} className="text-primary" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground truncate">
          {record.file.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatFileSize(record.file.size)} · {formatTimestamp(record.transferTime)}
        </p>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="
          w-10 h-10 rounded-lg
          bg-primary/10 text-primary
          flex items-center justify-center
          shrink-0 transition-opacity
          disabled:opacity-50
          active:scale-95
        "
        aria-label="Download file"
      >
        {downloading ? (
          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <Download size={18} />
        )}
      </button>
    </div>
  );
}

export default function RecentlyReceived() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal() ?? null;
  const { data: transfers, isLoading } = useGetTransferHistory(principal);

  const receivedTransfers = filterReceivedTransfers(transfers || [], principal).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (receivedTransfers.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-base text-muted-foreground">No recent files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {receivedTransfers.map((record) => (
        <FileItem key={record.id} record={record} />
      ))}
    </div>
  );
}
