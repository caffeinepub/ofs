import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  FileIcon,
  Loader2,
  QrCode,
  ScanLine,
  Send,
  Share2,
  Upload,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useTransfer } from "../contexts/TransferContext";
import { useActor } from "../hooks/useActor";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useLocalHistory } from "../hooks/useLocalHistory";
import { useLocalProfile } from "../hooks/useLocalProfile";
import {
  useGetMultipleUserProfiles,
  useGetOnlineUsers,
} from "../hooks/useQueries";
import { validateFileSize } from "../utils/fileSizeValidation";
import QRCodeDialog from "./QRCodeDialog";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SelectedUser {
  name: string;
  principal: string;
}

// ---- Online Users Dropdown ----
interface OnlineUsersDropdownProps {
  selectedUser: SelectedUser | null;
  onSelect: (user: SelectedUser) => void;
}

function OnlineUsersDropdown({
  selectedUser,
  onSelect,
}: OnlineUsersDropdownProps) {
  const [open, setOpen] = useState(false);
  const { data: onlinePrincipals = [], isLoading } = useGetOnlineUsers();
  const { data: profiles = {} } = useGetMultipleUserProfiles(onlinePrincipals);

  const userEntries = onlinePrincipals.map((p, idx) => {
    const profileData = profiles[p.toString()] as {
      displayName?: string;
    } | null;
    return {
      key: p.toString(),
      name: profileData?.displayName || `User ${idx + 1}`,
      idx,
    };
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Send To
      </p>
      <div className="relative">
        <button
          type="button"
          data-ocid="transfer.users.toggle"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 text-left shadow-sm transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <span
              className={
                selectedUser
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }
            >
              {selectedUser?.name ||
                (isLoading ? "Loading users…" : "Select a user")}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            data-ocid="transfer.users.dropdown_menu"
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
          >
            {userEntries.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                No users online right now
              </div>
            ) : (
              userEntries.map(({ key, name, idx }) => (
                <button
                  key={key}
                  type="button"
                  data-ocid={`transfer.users.item.${idx + 1}`}
                  onClick={() => {
                    onSelect({ name, principal: key });
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{name}</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main FileTransfer Component ----
interface FileTransferProps {
  onNavigateToReceived?: () => void;
}

export default function FileTransfer({
  onNavigateToReceived: _onNavigateToReceived,
}: FileTransferProps) {
  const { profile } = useLocalProfile();
  const { addSent } = useLocalHistory();
  const { pendingFile, clearPendingFile } = useTransfer();
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const { actor } = useActor();

  const senderName = profile?.displayName || "Anonymous";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSendingToUser, setIsSendingToUser] = useState(false);
  const [isUploadingQR, setIsUploadingQR] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFile) {
      const validation = validateFileSize(pendingFile.size);
      if (validation.type !== "error") {
        setSelectedFile(pendingFile);
        setTransferError(null);
      }
      clearPendingFile();
    }
  }, [pendingFile, clearPendingFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFileSize(file.size);
    if (validation.type === "error") {
      setTransferError(validation.message);
      return;
    }
    triggerLight();
    setTransferError(null);
    setSelectedFile(file);
  };

  const readFileAsBytes = (file: File): Promise<Uint8Array<ArrayBuffer>> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve(
          new Uint8Array(
            e.target?.result as ArrayBuffer,
          ) as Uint8Array<ArrayBuffer>,
        );
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  // Share via QR Code — upload then show QR
  const handleShareQR = async () => {
    if (!selectedFile || !actor) {
      toast.error("Please select a file first");
      return;
    }
    setIsUploadingQR(true);
    setUploadProgress(0);
    try {
      const bytes = await readFileAsBytes(selectedFile);
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      triggerSuccess();
      addSent({
        id: `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "application/octet-stream",
        peerName: "Via QR Code",
        timestamp: Date.now(),
      });
      setQrSessionId(id);
      setQrDialogOpen(true);
    } catch (e) {
      console.error("QR upload failed:", e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingQR(false);
      setUploadProgress(0);
    }
  };

  // Share to selected user
  const handleShareToUser = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    if (!selectedUser) {
      toast.error("Please select a user to send to");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please wait.");
      return;
    }
    setIsSendingToUser(true);
    setUploadProgress(0);
    const startTime = Date.now();
    try {
      const bytes = await readFileAsBytes(selectedFile);
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      const duration = BigInt(Date.now() - startTime);
      try {
        const callerProfile = await actor.getCallerUserProfile();
        const onlinePrincipals = await actor.getOnlineUsers();
        const receiverPrincipal = onlinePrincipals.find(
          (p) => p.toString() === selectedUser.principal,
        );
        if (receiverPrincipal && callerProfile !== null) {
          const fileMetadata = await actor.getFileMetadata(id);
          await actor.recordTransfer(
            `transfer-${Date.now()}`,
            fileMetadata.uploader,
            receiverPrincipal,
            fileMetadata,
            duration,
            true,
          );
        }
      } catch (e) {
        console.warn("recordTransfer failed (non-fatal):", e);
      }
      triggerSuccess();
      addSent({
        id: `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "application/octet-stream",
        peerName: selectedUser.name,
        timestamp: Date.now(),
      });
      toast.success(`File sent to ${selectedUser.name}!`);
      setSelectedFile(null);
      setSelectedUser(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.error("Send to user failed:", e);
      toast.error("Failed to send file. Please try again.");
    } finally {
      setIsSendingToUser(false);
      setUploadProgress(0);
    }
  };

  // Web Share API fallback
  const handleWebShare = async () => {
    if (!selectedFile) return;
    try {
      await navigator.share({
        files: [selectedFile],
        title: selectedFile.name,
      });
      triggerSuccess();
      addSent({
        id: `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "application/octet-stream",
        peerName: "Via Device Share",
        timestamp: Date.now(),
      });
      toast.success("File shared!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        toast.error("Share failed");
      }
    }
  };

  const canWebShare =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.canShare === "function" &&
    !!selectedFile &&
    navigator.canShare({ files: [selectedFile] });

  const isUploading = isSendingToUser || isUploadingQR;

  return (
    <>
      <div className="space-y-5 pb-6">
        {/* SENDING AS card */}
        <div
          className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 shadow-sm"
          data-ocid="transfer.section"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sending as
            </p>
            <p className="font-bold text-base text-foreground truncate">
              {senderName}
            </p>
          </div>
        </div>

        {/* Online Users Dropdown */}
        <OnlineUsersDropdown
          selectedUser={selectedUser}
          onSelect={setSelectedUser}
        />

        {/* FILE section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            File
          </p>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="transfer-file-input"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/5 px-4 py-4">
              <FileIcon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="transfer-file-input"
              data-ocid="transfer.upload_button"
              className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 py-10 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Tap to select a file
              </p>
              <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
            </label>
          )}

          {transferError && (
            <p
              data-ocid="transfer.error_state"
              className="text-sm text-destructive"
            >
              {transferError}
            </p>
          )}
        </div>

        {/* Upload progress bar */}
        {isUploading && (
          <div className="space-y-2" data-ocid="transfer.loading_state">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {isSendingToUser
                  ? `Sending to ${selectedUser?.name}…`
                  : "Uploading for QR sharing…"}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2 rounded-full" />
          </div>
        )}

        {/* Share actions — visible only when file is selected */}
        {selectedFile && !isUploading && (
          <div className="flex flex-col gap-3">
            {/* Share via QR Code */}
            <Button
              onClick={handleShareQR}
              data-ocid="transfer.primary_button"
              className="w-full h-14 text-base rounded-2xl gap-2"
              disabled={!actor}
            >
              {isUploadingQR ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              Share via QR Code
            </Button>

            {/* Share via Scanner */}
            <Button
              onClick={handleShareQR}
              data-ocid="transfer.scanner.button"
              variant="secondary"
              className="w-full h-14 text-base rounded-2xl gap-2"
              disabled={!actor}
            >
              {isUploadingQR ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ScanLine className="w-5 h-5" />
              )}
              Share via Scanner
            </Button>

            {/* Share to User */}
            <Button
              onClick={handleShareToUser}
              data-ocid="transfer.secondary_button"
              variant="outline"
              className="w-full h-14 text-base rounded-2xl gap-2"
              disabled={!actor || !selectedUser || isSendingToUser}
            >
              {isSendingToUser ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {selectedUser
                ? `Send to ${selectedUser.name}`
                : "Select a user above"}
            </Button>

            {/* Web Share API fallback */}
            {canWebShare && (
              <Button
                onClick={handleWebShare}
                data-ocid="transfer.share.button"
                variant="ghost"
                className="w-full h-12 text-sm rounded-2xl gap-2 text-muted-foreground"
              >
                <Share2 className="w-4 h-4" />
                Share via Device
              </Button>
            )}
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onClose={() => {
          setQrDialogOpen(false);
          setSelectedFile(null);
          setSelectedUser(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        sessionId={qrSessionId}
        fileName={selectedFile?.name}
      />
    </>
  );
}
