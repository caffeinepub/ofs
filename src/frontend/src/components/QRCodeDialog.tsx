import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { encodeQRPayload } from '../utils/qrPayload';
import { toast } from 'sonner';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  expirySeconds?: number;
}

export default function QRCodeDialog({ open, onOpenChange, sessionId, expirySeconds = 300 }: QRCodeDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      setTimeLeft(expirySeconds);
      return;
    }

    const generateQR = async () => {
      setIsGenerating(true);
      try {
        const QRCode = (window as any).QRCode;
        if (!QRCode) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        const deepLink = encodeQRPayload(sessionId);
        const canvas = document.createElement('canvas');
        await (window as any).QRCode.toCanvas(canvas, deepLink, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        setQrDataUrl(canvas.toDataURL());
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        toast.error('Failed to generate QR code');
      } finally {
        setIsGenerating(false);
      }
    };

    generateQR();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onOpenChange(false);
          toast.error('QR code expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, sessionId, expirySeconds, onOpenChange]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code-${sessionId}.png`;
    link.click();
    toast.success('QR code downloaded');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Scan this code with another device to receive the file
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="flex h-[300px] w-[300px] items-center justify-center bg-muted rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            <div className="rounded-lg border-4 border-border p-2 bg-white">
              <img src={qrDataUrl} alt="QR Code" className="w-full h-auto" style={{ maxWidth: '300px' }} />
            </div>
          ) : (
            <div className="flex h-[300px] w-[300px] items-center justify-center bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-medium">Expires in {formatTime(timeLeft)}</p>
            <p className="text-xs text-muted-foreground mt-1">Session ID: {sessionId.slice(0, 8)}...</p>
          </div>

          <Button onClick={handleDownload} disabled={!qrDataUrl} variant="outline" className="w-full h-12">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
