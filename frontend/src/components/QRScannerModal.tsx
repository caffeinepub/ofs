import React, { useEffect, useRef, useState } from 'react';
import { useQRScanner } from '../qr-code/useQRScanner';
import { parseQRPayload } from '../utils/qrPayload';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { X, Camera, AlertCircle, SwitchCamera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransferRecordData } from '../backend';

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (sessionId: string, transferRecord: TransferRecordData | null) => void;
}

export default function QRScannerModal({ open, onClose, onScanSuccess }: QRScannerModalProps) {
  const { triggerSuccess } = useHapticFeedback();
  const queryClient = useQueryClient();
  const { actor } = useActor();
  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
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

  // Start scanning when modal opens
  useEffect(() => {
    if (open) {
      setScanError(null);
      processedRef.current = null;
      clearResults();
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
    }
  }, [open]);

  // Handle QR results
  useEffect(() => {
    if (!qrResults.length || processing) return;

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

      // Invalidate transfer history so it refetches
      await queryClient.invalidateQueries({ queryKey: ['transferHistory'] });

      // Try to fetch the transfer record
      let transferRecord: TransferRecordData | null = null;
      if (actor) {
        try {
          transferRecord = await actor.getTransferRecord(sessionId);
        } catch (e) {
          console.warn('Could not fetch transfer record:', e);
        }
      }

      onScanSuccess(sessionId, transferRecord);
    } catch (e) {
      console.error('Error processing QR scan:', e);
      setScanError('Failed to process QR code. Please try again.');
      processedRef.current = null;
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-black/80">
        <h2 className="text-white text-lg font-semibold">Scan QR Code</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera area */}
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
      <div className="px-4 py-6 bg-black/80 flex flex-col gap-3">
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
          onClick={onClose}
          className="w-full h-12 text-base rounded-2xl text-white/70 hover:text-white hover:bg-white/10"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
