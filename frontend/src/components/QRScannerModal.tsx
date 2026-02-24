import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useQRScanner } from '../qr-code/useQRScanner';
import { parseQRPayload } from '../utils/qrPayload';
import { toast } from 'sonner';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionScanned?: (sessionId: string) => void;
}

export default function QRScannerModal({ open, onOpenChange, onSessionScanned }: QRScannerModalProps) {
  const { triggerSuccess } = useHapticFeedback();
  const navigate = useNavigate();
  
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 1,
  });

  useEffect(() => {
    if (open && canStartScanning) {
      startScanning();
    }

    return () => {
      if (isActive) {
        stopScanning();
      }
    };
  }, [open, canStartScanning]);

  useEffect(() => {
    if (qrResults.length > 0) {
      const latestResult = qrResults[0];
      handleQRScanned(latestResult.data);
    }
  }, [qrResults]);

  const handleQRScanned = async (data: string) => {
    try {
      const sessionId = parseQRPayload(data);

      if (!sessionId) {
        toast.error('Invalid QR code format');
        clearResults();
        return;
      }

      triggerSuccess();
      toast.success('QR code scanned successfully!');
      
      await stopScanning();
      onOpenChange(false);

      if (onSessionScanned) {
        onSessionScanned(sessionId);
      }

      // Navigate to History tab with Received subtab active
      navigate({ to: '/', search: { tab: 'history', subtab: 'received' } });
    } catch (error: any) {
      console.error('QR scan error:', error);
      toast.error(error.message || 'Failed to process QR code');
      clearResults();
    }
  };

  const handleClose = async () => {
    await stopScanning();
    clearResults();
    onOpenChange(false);
  };

  if (isSupported === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Camera Not Supported</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-sm text-muted-foreground">
              Your device doesn't support camera access. Please try a different device.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full h-12">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0">
        <div className="relative">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Scan QR Code</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-11 w-11"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="relative aspect-square w-full bg-black">
            {error ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-sm text-white">
                  {error.message}
                </p>
                <Button onClick={startScanning} variant="secondary" className="h-12">
                  Retry
                </Button>
              </div>
            ) : isLoading || !isActive ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-64 w-64 border-4 border-primary rounded-lg shadow-lg" />
                </div>
                {isScanning && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="bg-background/90 backdrop-blur px-4 py-2 rounded-full">
                      <p className="text-sm font-medium">Scanning...</p>
                    </div>
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
