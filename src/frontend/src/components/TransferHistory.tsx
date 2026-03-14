import { useNavigate } from "@tanstack/react-router";
import { Download, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { type HistoryRecord, useLocalHistory } from "../hooks/useLocalHistory";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeleteConfirmOverlay({
  record,
  onConfirm,
  onCancel,
}: {
  record: HistoryRecord;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      data-ocid="delete.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "#dc2626",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        gap: "20px",
      }}
    >
      <Trash2
        style={{ width: "56px", height: "56px", color: "#fff", opacity: 0.9 }}
      />
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#fff",
            marginBottom: "8px",
          }}
        >
          Delete this file?
        </p>
        <p
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.8)",
            maxWidth: "280px",
          }}
        >
          {record.fileName} will be permanently removed from your history.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          maxWidth: "280px",
        }}
      >
        <button
          type="button"
          data-ocid="delete.confirm_button"
          onClick={onConfirm}
          style={{
            padding: "16px",
            borderRadius: "14px",
            border: "2px solid rgba(255,255,255,0.5)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Confirm Delete
        </button>
        <button
          type="button"
          data-ocid="delete.cancel_button"
          onClick={onCancel}
          style={{
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            backgroundColor: "#fff",
            color: "#dc2626",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function HistoryItem({
  record,
  onDelete,
  direction,
}: {
  record: HistoryRecord;
  onDelete: () => void;
  direction: "sent" | "received";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderRadius: "14px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          backgroundColor:
            direction === "sent"
              ? "rgba(37,99,235,0.1)"
              : "rgba(22,163,74,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {direction === "sent" ? (
          <QrCode
            style={{ width: "18px", height: "18px", color: "var(--primary)" }}
          />
        ) : (
          <Download
            style={{ width: "18px", height: "18px", color: "#16a34a" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "14px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--foreground)",
          }}
        >
          {record.fileName}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--muted-foreground)",
            marginTop: "2px",
          }}
        >
          {formatBytes(record.fileSize)} ·{" "}
          {direction === "sent" ? "To: " : "From: "}
          {record.peerName}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--muted-foreground)",
            marginTop: "1px",
          }}
        >
          {formatDate(record.timestamp)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        data-ocid="history.delete_button"
        style={{
          padding: "8px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          color: "var(--muted-foreground)",
          flexShrink: 0,
        }}
      >
        <Trash2 style={{ width: "18px", height: "18px" }} />
      </button>
    </div>
  );
}

interface TransferHistoryProps {
  initialSubTab?: string;
}

export default function TransferHistory({
  initialSubTab,
}: TransferHistoryProps) {
  const [activeTab, setActiveTab] = useState(
    initialSubTab === "received" ? "received" : "sent",
  );
  const [deleteRecord, setDeleteRecord] = useState<{
    record: HistoryRecord;
    type: "sent" | "received";
  } | null>(null);
  const { sentFiles, receivedFiles, deleteSent, deleteReceived } =
    useLocalHistory();
  const navigate = useNavigate();

  const handleConfirmDelete = () => {
    if (!deleteRecord) return;
    if (deleteRecord.type === "sent") deleteSent(deleteRecord.record.id);
    else deleteReceived(deleteRecord.record.id);
    setDeleteRecord(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Scan QR Button */}
      <button
        type="button"
        data-ocid="history.scan.primary_button"
        onClick={() => navigate({ to: "/receive" })}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "2px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--foreground)",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <QrCode style={{ width: "18px", height: "18px" }} />
        Scan QR to Receive File
      </button>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          borderRadius: "12px",
          backgroundColor: "var(--muted)",
          padding: "4px",
          gap: "4px",
        }}
      >
        {(["sent", "received"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`history.${tab}.tab`}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "9px",
              border: "none",
              backgroundColor:
                activeTab === tab ? "var(--card)" : "transparent",
              color:
                activeTab === tab
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              fontSize: "14px",
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer",
              boxShadow:
                activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {activeTab === "sent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sentFiles.length === 0 ? (
            <div
              data-ocid="history.sent.empty_state"
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "var(--muted-foreground)",
              }}
            >
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                No sent files
              </p>
              <p style={{ fontSize: "13px" }}>
                Files you share will appear here
              </p>
            </div>
          ) : (
            sentFiles.map((r, i) => (
              <div key={r.id} data-ocid={`history.sent.item.${i + 1}`}>
                <HistoryItem
                  record={r}
                  direction="sent"
                  onDelete={() => setDeleteRecord({ record: r, type: "sent" })}
                />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "received" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {receivedFiles.length === 0 ? (
            <div
              data-ocid="history.received.empty_state"
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "var(--muted-foreground)",
              }}
            >
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                No received files
              </p>
              <p style={{ fontSize: "13px" }}>
                Scan a sender's QR code to receive files
              </p>
            </div>
          ) : (
            receivedFiles.map((r, i) => (
              <div key={r.id} data-ocid={`history.received.item.${i + 1}`}>
                <HistoryItem
                  record={r}
                  direction="received"
                  onDelete={() =>
                    setDeleteRecord({ record: r, type: "received" })
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteRecord && (
        <DeleteConfirmOverlay
          record={deleteRecord.record}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </div>
  );
}
