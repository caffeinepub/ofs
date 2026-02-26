import React, { useState, useCallback } from 'react';
import { Download, FileText, Image, Film, Music, Archive, Trash2 } from 'lucide-react';
import { useGetTransferHistory, useDeleteTransferRecord } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { TransferRecordData } from '../backend';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { useLongPress } from '../hooks/useLongPress';
import FileContextMenu from './FileContextMenu';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { toast } from 'sonner';
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
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { mutateAsync: deleteRecord, isPending: isDeleting } = useDeleteTransferRecord();
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

  const handleDelete = useCallback(async () => {
    try {
      await deleteRecord(record.id);
      toast.success('Transfer record deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete transfer record');
    }
  }, [record.id, deleteRecord]);

  const longPressHandlers = useLongPress({
    onLongPress: () => setContextMenuOpen(true),
    delay: 500,
  });

  return (
    <>
      <div
        {...longPressHandlers}
        className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border active:bg-muted/50 transition-colors"
      >
        {/* File icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileIcon size={22} className="text-primary" />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {record.file.name}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatFileSize(record.file.size)} · {formatTimestamp(record.transferTime)}
          </p>
          {record.file.uploader && (
            <p className="text-sm text-muted-foreground truncate">
              From: {record.file.uploader.toString().slice(0, 8)}…
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="
              w-11 h-11 rounded-xl
              bg-primary/10 text-primary
              flex items-center justify-center
              transition-opacity
              disabled:opacity-50
              active:scale-95
            "
            aria-label="Download file"
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Download size={20} />
            )}
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteOpen(true);
            }}
            disabled={isDeleting}
            className="
              w-11 h-11 rounded-xl
              bg-destructive/10 text-destructive
              flex items-center justify-center
              transition-opacity
              disabled:opacity-50
              active:scale-95
            "
            aria-label="Delete record"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Red background confirmation dialog */}
      <DeleteConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        fileName={record.file.name}
        isDeleting={isDeleting}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {/* Long-press context menu (kept for backwards compatibility) */}
      <FileContextMenu
        open={contextMenuOpen}
        onOpenChange={(open) => setContextMenuOpen(open)}
        file={contextMenuOpen ? record : null}
        onDownload={() => {
          handleDownload();
          setContextMenuOpen(false);
        }}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default function ReceivedDownloadsList() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal() ?? null;
  const { data: transfers, isLoading } = useGetTransferHistory(principal);

  const receivedTransfers = filterReceivedTransfers(transfers || [], principal);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (receivedTransfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <img
          src="/assets/generated/empty-history.dim_300x200.png"
          alt="No received files"
          className="w-48 h-32 object-contain mb-4 opacity-70"
          loading="lazy"
        />
        <p className="text-lg font-semibold text-foreground">No received files</p>
        <p className="text-base text-muted-foreground mt-1">
          Files sent to you will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {receivedTransfers.map((record) => (
        <FileItem key={record.id} record={record} />
      ))}
    </div>
  );
}
