import React, { useState } from 'react';
import { Principal } from '@dfinity/principal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileIcon, User, CheckCircle, Loader2 } from 'lucide-react';
import type { TransferRecordData } from '../backend';
import { formatFileSize } from '../utils/receivedDownloads';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';

interface QRReceiveDialogProps {
  open: boolean;
  onClose: () => void;
  transferRecord: TransferRecordData | null;
}

function useSenderProfile(senderPrincipalStr: string | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: ['userProfile', senderPrincipalStr],
    queryFn: async () => {
      if (!actor || !senderPrincipalStr) return null;
      try {
        const principal = Principal.fromText(senderPrincipalStr);
        return await actor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !!senderPrincipalStr,
  });
}

export default function QRReceiveDialog({ open, onClose, transferRecord }: QRReceiveDialogProps) {
  const { triggerSuccess, triggerMedium } = useHapticFeedback();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const senderPrincipalStr = transferRecord?.sender?.toString() ?? null;
  const { data: senderProfile } = useSenderProfile(senderPrincipalStr);

  const handleDownload = async () => {
    if (!transferRecord) return;
    setDownloading(true);
    try {
      await downloadTransferFile(
        transferRecord.file.blob,
        transferRecord.file.name,
        transferRecord.file.fileType
      );
      triggerSuccess();
      setDownloaded(true);
      setTimeout(() => {
        onClose();
        setDownloaded(false);
      }, 1200);
    } catch (e) {
      console.error('Download failed:', e);
      triggerMedium();
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    setDownloaded(false);
    onClose();
  };

  if (!transferRecord) return null;

  const { file } = transferRecord;
  const senderName =
    senderProfile?.displayName ??
    (senderPrincipalStr ? senderPrincipalStr.slice(0, 12) + '...' : 'Unknown');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="mx-4 rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {downloaded ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Download className="w-5 h-5 text-primary" />
            )}
            {downloaded ? 'File Received!' : 'File Ready to Download'}
          </DialogTitle>
          <DialogDescription>
            {downloaded
              ? 'The file has been saved to your device.'
              : 'Someone shared a file with you via QR code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File info card */}
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{file.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {formatFileSize(file.size)}
                </p>
                {file.fileType && (
                  <p className="text-muted-foreground text-xs">{file.fileType}</p>
                )}
              </div>
            </div>

            {/* Sender info */}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">From:</span>
              <span className="text-sm font-medium truncate">{senderName}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="w-full h-12 text-base rounded-xl"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : downloaded ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={downloading}
            className="w-full h-12 text-base rounded-xl"
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
