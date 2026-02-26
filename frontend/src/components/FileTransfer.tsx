import React, { useState, useRef } from 'react';
import { Upload, Users, QrCode, WifiOff, X, FileIcon, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetOnlineUsers, useGetUserProfile, useRecordTransfer } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { validateFileSize } from '../utils/fileSizeValidation';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import NetworkWarningDialog from './NetworkWarningDialog';
import QRCodeDialog from './QRCodeDialog';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Principal } from '@dfinity/principal';

interface FileTransferProps {
  displayName?: string;
}

interface SelectedFile {
  file: File;
  id: string;
}

function UserItem({
  principal,
  onSelect,
  selected,
}: {
  principal: string;
  onSelect: (p: string) => void;
  selected: boolean;
}) {
  const principalObj = React.useMemo(() => {
    try {
      return Principal.fromText(principal);
    } catch {
      return null;
    }
  }, [principal]);
  const { data: profile } = useGetUserProfile(principalObj);

  return (
    <button
      onClick={() => onSelect(principal)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          selected
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {profile?.displayName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p
          className={`font-medium text-sm truncate ${
            selected ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {profile?.displayName ?? 'Loading...'}
        </p>
        <p
          className={`text-xs truncate ${
            selected ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {principal.slice(0, 20)}...
        </p>
      </div>
      {selected && <CheckCircle className="w-5 h-5 shrink-0" />}
    </button>
  );
}

export default function FileTransfer({ displayName }: FileTransferProps) {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const isOnline = useOnlineStatus();
  const { triggerLight, triggerSuccess, triggerMedium } = useHapticFeedback();
  const networkInfo = useNetworkInfo();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: onlineUsers = [] } = useGetOnlineUsers();
  const recordTransferMutation = useRecordTransfer();

  const otherUsers = onlineUsers.filter(
    (p) => p.toString() !== identity?.getPrincipal().toString()
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFileSize(file.size);
    if (validation.type === 'error') {
      setTransferError(validation.message);
      return;
    }

    triggerLight();
    setTransferError(null);
    setTransferSuccess(false);
    setSelectedFile({
      file,
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  };

  const doTransfer = async () => {
    if (!selectedFile || !selectedRecipient || !actor || !identity) return;

    setTransferring(true);
    setTransferError(null);
    const startTime = Date.now();

    try {
      const fileBytes = new Uint8Array(await selectedFile.file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(fileBytes);

      await actor.uploadFile(
        selectedFile.id,
        selectedFile.file.name,
        BigInt(selectedFile.file.size),
        selectedFile.file.type || 'application/octet-stream',
        blob
      );

      const duration = BigInt(Date.now() - startTime);
      const receiverPrincipal = Principal.fromText(selectedRecipient);
      const senderPrincipal = identity.getPrincipal();

      const fileMetadata = {
        id: selectedFile.id,
        name: selectedFile.file.name,
        size: BigInt(selectedFile.file.size),
        fileType: selectedFile.file.type || 'application/octet-stream',
        uploader: senderPrincipal,
        uploadTime: BigInt(Date.now()) * BigInt(1_000_000),
        blob,
      };

      const transferId = `transfer-${selectedFile.id}`;
      await recordTransferMutation.mutateAsync({
        id: transferId,
        sender: senderPrincipal,
        receiver: receiverPrincipal,
        file: fileMetadata,
        duration,
        success: true,
      });

      triggerSuccess();
      setTransferSuccess(true);
      setSelectedFile(null);
      setSelectedRecipient(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transfer failed. Please try again.';
      console.error('Transfer failed:', e);
      triggerMedium();
      setTransferError(msg);
    } finally {
      setTransferring(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedFile || !selectedRecipient) return;

    const validation = validateFileSize(selectedFile.file.size);
    if (validation.type === 'warning' && (networkInfo.isSlow || networkInfo.isMetered)) {
      setShowNetworkWarning(true);
      return;
    }

    await doTransfer();
  };

  const handleNetworkWarningProceed = async () => {
    setShowNetworkWarning(false);
    await doTransfer();
  };

  const handleQRShare = async () => {
    if (!selectedFile || !actor || !identity) return;

    setTransferring(true);
    setTransferError(null);

    try {
      const fileBytes = new Uint8Array(await selectedFile.file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(fileBytes);

      await actor.uploadFile(
        selectedFile.id,
        selectedFile.file.name,
        BigInt(selectedFile.file.size),
        selectedFile.file.type || 'application/octet-stream',
        blob
      );

      const senderPrincipal = identity.getPrincipal();

      const fileMetadata = {
        id: selectedFile.id,
        name: selectedFile.file.name,
        size: BigInt(selectedFile.file.size),
        fileType: selectedFile.file.type || 'application/octet-stream',
        uploader: senderPrincipal,
        uploadTime: BigInt(Date.now()) * BigInt(1_000_000),
        blob,
      };

      const transferId = `transfer-${selectedFile.id}`;
      await recordTransferMutation.mutateAsync({
        id: transferId,
        sender: senderPrincipal,
        receiver: senderPrincipal,
        file: fileMetadata,
        duration: BigInt(0),
        success: true,
      });

      setQrSessionId(transferId);
      setQrDialogOpen(true);
      triggerLight();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to prepare file for sharing.';
      console.error('QR share failed:', e);
      triggerMedium();
      setTransferError(msg);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* User greeting */}
        {displayName && (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">Sending as</p>
            <p className="font-semibold text-lg">{displayName}</p>
          </div>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <WifiOff className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-destructive text-sm font-medium">
              You are offline. File transfer requires internet.
            </p>
          </div>
        )}

        {/* File selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
            File
          </p>
          {selectedFile ? (
            <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile.file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted-foreground/10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Tap to select a file</p>
              <p className="text-xs text-muted-foreground/70">Max 50MB</p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Transfer error */}
        {transferError && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{transferError}</p>
          </div>
        )}

        {/* Transfer success */}
        {transferSuccess && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
              File transferred successfully!
            </p>
          </div>
        )}

        {/* QR Share button */}
        {selectedFile && (
          <Button
            onClick={handleQRShare}
            disabled={transferring || !isOnline}
            variant="outline"
            className="w-full h-12 text-base rounded-2xl gap-2"
          >
            {transferring ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <QrCode className="w-5 h-5" />
            )}
            {transferring ? 'Preparing...' : 'Share via QR Code'}
          </Button>
        )}

        {/* Recipient selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
            Send to User
          </p>
          {otherUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No other users online</p>
              <p className="text-muted-foreground/70 text-xs">
                Use QR code to share with offline users
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {otherUsers.map((p) => (
                <UserItem
                  key={p.toString()}
                  principal={p.toString()}
                  onSelect={setSelectedRecipient}
                  selected={selectedRecipient === p.toString()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        {selectedRecipient && selectedFile && (
          <Button
            onClick={handleTransfer}
            disabled={transferring || !isOnline}
            className="w-full h-14 text-base rounded-2xl"
          >
            {transferring ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Send File
              </>
            )}
          </Button>
        )}
      </div>

      {/* Network Warning Dialog */}
      <NetworkWarningDialog
        isOpen={showNetworkWarning}
        onClose={() => setShowNetworkWarning(false)}
        onProceed={handleNetworkWarningProceed}
        fileSize={selectedFile?.file.size ?? 0}
        connectionType={networkInfo.connectionType}
        isMetered={networkInfo.isMetered}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onClose={() => {
          setQrDialogOpen(false);
          setQrSessionId('');
        }}
        sessionId={qrSessionId}
        fileName={selectedFile?.file.name}
      />
    </div>
  );
}
