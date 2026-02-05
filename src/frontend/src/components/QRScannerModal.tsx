import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQRScanner } from '../qr-code/useQRScanner';
import { useFetchFileMetadataByQRCode } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Camera, Loader2, AlertCircle, CheckCircle2, SwitchCamera, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import type { FileMetadata } from '../backend';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileScanned: (fileMetadata: FileMetadata) => void;
}

export default function QRScannerModal({ open, onOpenChange, onFileScanned }: QRScannerModalProps) {
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
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 1,
  });

  const fetchFileMetadata = useFetchFileMetadataByQRCode();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();
  const [processingQR, setProcessingQR] = useState(false);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (open && canStartScanning && !isActive && identity && isOnline) {
      startScanning();
    }
  }, [open, canStartScanning, isActive, identity, isOnline]);

  useEffect(() => {
    if (!open && isActive) {
      stopScanning();
      clearResults();
    }
  }, [open, isActive]);

  useEffect(() => {
    if (qrResults.length > 0 && !processingQR && identity && isOnline) {
      const latestResult = qrResults[0];
      handleQRCodeScanned(latestResult.data);
    }
  }, [qrResults, processingQR, identity, isOnline]);

  const handleQRCodeScanned = async (qrData: string) => {
    if (!identity || !isOnline) return;

    setProcessingQR(true);
    
    try {
      const qrId = qrData;
      const fileMetadata = await fetchFileMetadata.mutateAsync(qrId);
      
      if (fileMetadata) {
        toast.success('File found! Preparing to receive...');
        onFileScanned(fileMetadata);
        onOpenChange(false);
      } else {
        toast.error('Invalid or expired QR code');
        clearResults();
        setProcessingQR(false);
      }
    } catch (error: any) {
      console.error('QR code processing error:', error);
      
      if (error.message?.includes('expired')) {
        toast.error('QR code has expired');
      } else if (error.message?.includes('invalid')) {
        toast.error('Invalid QR code');
      } else if (error.message?.includes('Unauthorized')) {
        toast.error('Unauthorized access to this file');
      } else {
        toast.error('Failed to process QR code');
      }
      
      clearResults();
      setProcessingQR(false);
    }
  };

  const handleClose = () => {
    stopScanning();
    clearResults();
    setProcessingQR(false);
    onOpenChange(false);
  };

  if (!identity || !isOnline) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Scanner Unavailable</DialogTitle>
            <DialogDescription>
              {!identity ? 'Login required' : 'Internet connection required'}
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {!identity 
                ? 'Please login to use QR code scanning features.'
                : 'This feature requires an internet connection.'}
            </AlertDescription>
          </Alert>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (isSupported === false) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Camera Not Supported</DialogTitle>
            <DialogDescription>
              Your browser or device does not support camera access.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please use a modern browser with camera support to scan QR codes.
            </AlertDescription>
          </Alert>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at a QR code to receive a file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {isScanning && !processingQR && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-lg border-4 border-primary animate-pulse" />
              </div>
            )}

            {(isLoading || processingQR) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {processingQR ? 'Processing QR code...' : 'Starting camera...'}
                  </p>
                </div>
              </div>
            )}

            {qrResults.length > 0 && processingQR && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-sm font-medium">QR Code Detected!</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.type === 'permission' && 'Camera permission denied. Please allow camera access.'}
                {error.type === 'not-found' && 'No camera found on this device.'}
                {error.type === 'not-supported' && 'Camera not supported in this browser.'}
                {error.type === 'unknown' && `Camera error: ${error.message}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isActive && !isLoading && (
              <Button onClick={startScanning} disabled={!canStartScanning} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            )}
            
            {isActive && isMobile && (
              <Button onClick={switchCamera} disabled={isLoading || processingQR} variant="outline">
                <SwitchCamera className="mr-2 h-4 w-4" />
                Switch
              </Button>
            )}
            
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>

          {isScanning && !processingQR && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Position the QR code within the frame to scan
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
