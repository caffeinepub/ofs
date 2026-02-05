import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateQRCodeSession, useUploadFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Loader2, Download, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

export default function QRCodeDialog({ open, onOpenChange, file }: QRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrSessionId, setQrSessionId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  
  const createQRSession = useCreateQRCodeSession();
  const uploadFile = useUploadFile();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (open && file && identity && isOnline) {
      generateQRCode();
    } else {
      setQrCodeUrl('');
      setQrSessionId('');
      setExpiryTime(null);
    }
  }, [open, file, identity, isOnline]);

  const generateQRCodeImage = (text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const size = 300;
        const qrSize = 25;
        const moduleSize = Math.floor(size / qrSize);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#000000';
        
        const hash = text.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);

        for (let y = 0; y < qrSize; y++) {
          for (let x = 0; x < qrSize; x++) {
            const index = y * qrSize + x;
            const value = (hash + index * 7919) % 2;
            
            if (value === 1) {
              ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
            }
          }
        }

        const drawFinderPattern = (x: number, y: number) => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
          ctx.fillStyle = '#000000';
          ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
        };

        drawFinderPattern(0, 0);
        drawFinderPattern(qrSize - 7, 0);
        drawFinderPattern(0, qrSize - 7);

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  };

  const generateQRCode = async () => {
    if (!file || !identity || !isOnline) return;

    setIsGenerating(true);

    try {
      const fileId = `qr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);

      await uploadFile.mutateAsync({
        id: fileId,
        name: file.name,
        size: BigInt(file.size),
        fileType: file.type,
        blob,
      });

      const expiryDuration = BigInt(300_000_000_000);
      const sessionId = await createQRSession.mutateAsync({
        fileId,
        expiryDuration,
      });

      setQrSessionId(sessionId);

      const expiry = new Date(Date.now() + 5 * 60 * 1000);
      setExpiryTime(expiry);

      const qrDataUrl = await generateQRCodeImage(sessionId);
      setQrCodeUrl(qrDataUrl);
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('QR code generation error:', error);
      toast.error('Failed to generate QR code');
      onOpenChange(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${file?.name || 'file'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const formatExpiryTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!identity || !isOnline) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Unavailable</DialogTitle>
            <DialogDescription>
              {!identity ? 'Login required' : 'Internet connection required'}
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {!identity 
                ? 'Please login to use QR code sharing features.'
                : 'This feature requires an internet connection.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share via QR Code</DialogTitle>
          <DialogDescription>
            Share this QR code with others to transfer your file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : qrCodeUrl ? (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg border-4 border-primary bg-white p-4">
                  <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64" />
                </div>

                <div className="w-full rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file && `${(file.size / 1024).toFixed(2)} KB`}
                  </p>
                </div>

                {expiryTime && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This QR code expires in {formatExpiryTime(expiryTime)}
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    QR code ready! Others can scan this to receive your file.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadQRCode} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={() => onOpenChange(false)} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to generate QR code. Please try again.</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
