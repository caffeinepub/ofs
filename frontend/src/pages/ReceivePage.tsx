import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQRScanner } from '../qr-code/useQRScanner';
import { parseQRPayload } from '../utils/qrPayload';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  SwitchCamera,
  Loader2,
  Download,
  FileIcon,
  User,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransferRecordData } from '../backend';
import { formatFileSize } from '../utils/receivedDownloads';
import { downloadTransferFile } from '../utils/downloadTransferFile';

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

export default function ReceivePage() {
  const navigate = useNavigate();
  const { triggerSuccess, triggerMedium } = useHapticFeedback();
  const queryClient = useQueryClient();
  const { actor } = useActor();

  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [transferRecord, setTransferRecord] = useState<TransferRecordData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const processedRef = useRef<string | null>(null);

  const {
    qrResults,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 150,
    maxResults: 5,
  });

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const senderPrincipalStr = transferRecord?.sender?.toString() ?? null;
  const { data: senderProfile } = useSenderProfile(senderPrincipalStr);

  // Auto-start scanning on mount
  useEffect(() => {
    setScanError(null);
    processedRef.current = null;
    clearResults();
    const timer = setTimeout(() => {
      startScanning();
    }, 300);
    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, []);

  // Handle QR results
  useEffect(() => {
    if (!qrResults.length || processing || transferRecord) return;

    const latest = qrResults[0];
    if (processedRef.current === latest.data) return;
    processedRef.current = latest.data;

    const sessionId = parseQRPayload(latest.data);
    if (!sessionId) {
      setScanError('Invalid QR code. Please scan a valid file sharing QR code.');
      processedRef.current = null;
      return;
    }

    handleSuccessfulScan(sessionId);
  }, [qrResults]);

  const handleSuccessfulScan = async (sessionId: string) => {
    setProcessing(true);
    setScanError(null);

    try {
      triggerSuccess();
      await stopScanning();

      await queryClient.invalidateQueries({ queryKey: ['transferHistory'] });

      let record: TransferRecordData | null = null;
      if (actor) {
        try {
          record = await actor.getTransferRecord(sessionId);
        } catch (e) {
          console.warn('Could not fetch transfer record:', e);
        }
      }

      setTransferRecord(record);
    } catch (e) {
      console.error('Error processing QR scan:', e);
      setScanError('Failed to process QR code. Please try again.');
      processedRef.current = null;
    } finally {
      setProcessing(false);
    }
  };

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
    } catch (e) {
      console.error('Download failed:', e);
      triggerMedium();
    } finally {
      setDownloading(false);
    }
  };

  const handleScanAnother = () => {
    setTransferRecord(null);
    setDownloaded(false);
    setScanError(null);
    processedRef.current = null;
    clearResults();
    setTimeout(() => startScanning(), 300);
  };

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const senderName =
    senderProfile?.displayName ??
    (senderPrincipalStr ? senderPrincipalStr.slice(0, 12) + '...' : 'Unknown');

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-black/80 safe-area-top">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-lg font-semibold">Receive File</h2>
        <div className="w-10" />
      </div>

      {/* Content */}
      {!transferRecord ? (
        /* Scanner view */
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
            {isSupported === false ? (
              <div className="flex flex-col items-center gap-3 text-white text-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-lg font-semibold">Camera Not Supported</p>
                <p className="text-white/70 text-sm">
                  Your browser does not support camera access.
                </p>
              </div>
            ) : (
              <>
                {/* Video preview */}
                <div className="relative w-full max-w-sm">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-900">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning overlay */}
                    {isActive && !processing && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/80 rounded-xl relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                          <div className="absolute inset-x-0 h-0.5 bg-primary/80 animate-scan-line" />
                        </div>
                      </div>
                    )}

                    {/* Processing overlay */}
                    {processing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-white font-medium">Processing...</p>
                      </div>
                    )}

                    {/* Not active placeholder */}
                    {!isActive && !isLoading && !processing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Camera className="w-12 h-12 text-white/40" />
                        <p className="text-white/60 text-sm">Camera not active</p>
                      </div>
                    )}

                    {/* Loading */}
                    {isLoading && !processing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                        <p className="text-white/60 text-sm">Starting camera...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error messages */}
                {(error || scanError) && (
                  <div className="flex items-start gap-2 bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 max-w-sm w-full">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">
                      {scanError || error?.message || 'Camera error occurred'}
                    </p>
                  </div>
                )}

                <p className="text-white/60 text-sm text-center max-w-xs">
                  Point your camera at the sender's QR code to receive the file
                </p>
              </>
            )}
          </div>

          {/* Bottom controls */}
          <div className="px-4 py-6 bg-black/80 flex flex-col gap-3 safe-area-bottom">
            {!isActive && !isLoading && !processing && isSupported !== false && (
              <Button
                onClick={startScanning}
                disabled={!canStartScanning}
                className="w-full h-14 text-base rounded-2xl"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera
              </Button>
            )}

            {isMobile && isActive && (
              <Button
                variant="outline"
                onClick={switchCamera}
                disabled={isLoading || processing}
                className="w-full h-12 text-base rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <SwitchCamera className="w-5 h-5 mr-2" />
                Switch Camera
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full h-12 text-base rounded-2xl text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        /* File receive view */
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            {downloaded ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <Download className="w-10 h-10 text-primary" />
            )}
          </div>

          <div className="text-center">
            <h3 className="text-white text-xl font-bold mb-1">
              {downloaded ? 'File Saved!' : 'File Ready'}
            </h3>
            <p className="text-white/60 text-sm">
              {downloaded
                ? 'The file has been saved to your device.'
                : 'A file has been shared with you via QR code.'}
            </p>
          </div>

          {/* File info card */}
          <div className="w-full max-w-sm bg-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <FileIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{transferRecord.file.name}</p>
                <p className="text-white/60 text-sm mt-0.5">
                  {formatFileSize(transferRecord.file.size)}
                </p>
                {transferRecord.file.fileType && (
                  <p className="text-white/40 text-xs mt-0.5">{transferRecord.file.fileType}</p>
                )}
              </div>
            </div>

            {/* Sender info */}
            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <User className="w-4 h-4 text-white/40 shrink-0" />
              <span className="text-sm text-white/50">From:</span>
              <span className="text-sm font-medium text-white/80 truncate">{senderName}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm flex flex-col gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading || downloaded}
              className="w-full h-14 text-base rounded-2xl"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : downloaded ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download File
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleScanAnother}
              className="w-full h-12 text-base rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Scan Another
            </Button>

            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full h-12 text-base rounded-2xl text-white/70 hover:text-white hover:bg-white/10"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
