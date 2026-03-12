import { Archive, FileText, Film, Image, Music, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { HistoryRecord } from "../hooks/useLocalHistory";
import { useLocalHistory } from "../hooks/useLocalHistory";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.startsWith("video/")) return Film;
  if (fileType.startsWith("audio/")) return Music;
  if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileType.includes("tar")
  )
    return Archive;
  return FileText;
}

function FileItem({
  record,
  index,
  onDelete,
}: {
  record: HistoryRecord;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const FileIconComp = getFileIcon(record.fileType);

  return (
    <>
      <div
        data-ocid={`history.sent.item.${index + 1}`}
        className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileIconComp size={22} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {record.fileName}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatFileSize(record.fileSize)} ·{" "}
            {formatTimestamp(record.timestamp)}
          </p>
          {record.peerName && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              To: {record.peerName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          data-ocid={`history.sent.delete_button.${index + 1}`}
          className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Delete record"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <DeleteConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        fileName={record.fileName}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete(record.id);
          toast.success("Record deleted");
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}

export default function SentDownloadsList() {
  const { sentFiles, deleteSent } = useLocalHistory();

  if (sentFiles.length === 0) {
    return (
      <div
        data-ocid="history.sent.empty_state"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <img
          src="/assets/generated/empty-history.dim_300x200.png"
          alt="No sent files"
          className="w-48 h-32 object-contain mb-4 opacity-70"
          loading="lazy"
        />
        <p className="text-lg font-semibold text-foreground">No sent files</p>
        <p className="text-base text-muted-foreground mt-1">
          Files you send will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sentFiles.map((record, i) => (
        <FileItem
          key={record.id}
          record={record}
          index={i}
          onDelete={deleteSent}
        />
      ))}
    </div>
  );
}
