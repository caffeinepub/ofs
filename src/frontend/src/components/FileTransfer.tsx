import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  FileIcon,
  Loader2,
  ScanLine,
  Send,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useTransfer } from "../contexts/TransferContext";
import { useActor } from "../hooks/useActor";
import { useLocalHistory } from "../hooks/useLocalHistory";
import { useLocalProfile } from "../hooks/useLocalProfile";
import {
  useGetMultipleUserProfiles,
  useGetOnlineUsers,
} from "../hooks/useQueries";
import QRCodeDialog from "./QRCodeDialog";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Online Users Dropdown ----
interface SelectedUser {
  name: string;
  principal: string;
}

function OnlineUsersDropdown({
  selectedUser,
  onSelect,
}: {
  selectedUser: SelectedUser | null;
  onSelect: (u: SelectedUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: principals = [], isLoading } = useGetOnlineUsers();
  const { data: profiles = {} } = useGetMultipleUserProfiles(principals);

  const users = principals.map((p, i) => {
    const prof = profiles[p.toString()] as { displayName?: string } | null;
    return {
      key: p.toString(),
      name: prof?.displayName || `User ${i + 1}`,
      idx: i,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "var(--muted-foreground)",
        }}
      >
        Send To
      </p>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          data-ocid="transfer.users.toggle"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            padding: "14px 16px",
            textAlign: "left",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User
              style={{
                width: "18px",
                height: "18px",
                color: "var(--muted-foreground)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "15px",
                color: selectedUser
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              }}
            >
              {selectedUser?.name ||
                (isLoading ? "Loading\u2026" : "Select a user")}
            </span>
          </div>
          <ChevronDown
            style={{
              width: "16px",
              height: "16px",
              color: "var(--muted-foreground)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {open && (
          <div
            data-ocid="transfer.users.dropdown_menu"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 50,
              borderRadius: "14px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            {users.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: "14px",
                }}
              >
                No users online right now
              </div>
            ) : (
              users.map(({ key, name, idx }) => (
                <button
                  key={key}
                  type="button"
                  data-ocid={`transfer.users.item.${idx + 1}`}
                  onClick={() => {
                    onSelect({ name, principal: key });
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    color: "var(--foreground)",
                    fontSize: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(37,99,235,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "var(--primary)",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      flexShrink: 0,
                    }}
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FileTransfer() {
  const { profile } = useLocalProfile();
  const { addSent } = useLocalHistory();
  const { actor } = useActor();
  const { pendingFile, setPendingFile } = useTransfer();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [qrFileId, setQrFileId] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.displayName || "User";

  // Pick up pending file from AI tab
  useEffect(() => {
    if (pendingFile) {
      setSelectedFile(pendingFile);
      setPendingFile(null);
    }
  }, [pendingFile, setPendingFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
    e.target.value = "";
  };

  const handleShareViaScanner = async () => {
    if (!selectedFile) return;
    if (!actor) {
      toast.error("Backend not available");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const id = genId();
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      await actor.uploadFile(
        id,
        selectedFile.name,
        BigInt(selectedFile.size),
        selectedFile.type || "application/octet-stream",
        blob,
      );

      setUploadProgress(100);
      setQrFileId(id);
      setQrDialogOpen(true);

      addSent({
        id,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        peerName: "QR Scan",
        timestamp: Date.now(),
      });

      toast.success("File ready to share!", {
        description: "Show the QR code to the receiver.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleSendToUser = async () => {
    if (!selectedFile || !selectedUser || !actor) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const id = genId();
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      await actor.uploadFile(
        id,
        selectedFile.name,
        BigInt(selectedFile.size),
        selectedFile.type || "application/octet-stream",
        blob,
      );
      setUploadProgress(100);

      addSent({
        id,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        peerName: selectedUser.name,
        timestamp: Date.now(),
      });

      toast.success(`Sent to ${selectedUser.name}!`);
      setSelectedFile(null);
      setSelectedUser(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Send failed";
      toast.error("Send failed", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Sending As Card */}
      <div
        style={{
          borderRadius: "14px",
          backgroundColor: "var(--primary)",
          padding: "14px 18px",
          color: "#fff",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            opacity: 0.75,
            marginBottom: "2px",
          }}
        >
          Sending as
        </p>
        <p
          style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.3px" }}
        >
          {displayName}
        </p>
      </div>

      {/* Online Users Dropdown */}
      <OnlineUsersDropdown
        selectedUser={selectedUser}
        onSelect={setSelectedUser}
      />

      {/* File Picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--muted-foreground)",
          }}
        >
          File
        </p>

        {selectedFile ? (
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
                backgroundColor: "rgba(37,99,235,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileIcon
                style={{
                  width: "20px",
                  height: "20px",
                  color: "var(--primary)",
                }}
              />
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
                {selectedFile.name}
              </p>
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              data-ocid="transfer.file.close_button"
              style={{
                padding: "6px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--muted-foreground)",
              }}
            >
              <X style={{ width: "18px", height: "18px" }} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-ocid="transfer.upload_button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "14px",
              border: "2px dashed var(--border)",
              backgroundColor: "var(--muted)",
              padding: "32px 16px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <Upload
              style={{
                width: "28px",
                height: "28px",
                color: "var(--muted-foreground)",
              }}
            />
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Tap to select a file
            </p>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              Any file type supported
            </p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--muted-foreground)",
            }}
          >
            <span>Uploading\u2026</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Share via Scanner \u2014 ONLY when file is selected */}
      {selectedFile && (
        <button
          type="button"
          data-ocid="transfer.share.primary_button"
          onClick={handleShareViaScanner}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "16px",
            fontWeight: 700,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
            letterSpacing: "0.2px",
          }}
        >
          {uploading ? (
            <Loader2
              style={{
                width: "20px",
                height: "20px",
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <ScanLine style={{ width: "20px", height: "20px" }} />
          )}
          {uploading ? "Uploading\u2026" : "Share via Scanner"}
        </button>
      )}

      {/* Send to user button */}
      {selectedFile && selectedUser && (
        <button
          type="button"
          data-ocid="transfer.send.primary_button"
          onClick={handleSendToUser}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "2px solid var(--primary)",
            backgroundColor: "transparent",
            color: "var(--primary)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          <Send style={{ width: "18px", height: "18px" }} />
          Send to {selectedUser.name}
        </button>
      )}

      {/* QR Code Dialog */}
      {qrFileId && (
        <QRCodeDialog
          open={qrDialogOpen}
          onClose={() => {
            setQrDialogOpen(false);
            setSelectedFile(null);
          }}
          fileId={qrFileId}
          fileName={selectedFile?.name || ""}
        />
      )}
    </div>
  );
}
