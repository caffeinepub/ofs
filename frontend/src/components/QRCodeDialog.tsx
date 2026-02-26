import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { encodeQRPayload } from '../utils/qrPayload';
import { Clock, AlertCircle, QrCode } from 'lucide-react';

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  fileName?: string;
}

const QR_EXPIRY_SECONDS = 300;

function useQRCanvas(text: string, size: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!text) {
      setDataUrl('');
      setError(false);
      return;
    }
    setError(false);
    setDataUrl('');

    const encoded = encodeURIComponent(text);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=10`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          setDataUrl(canvas.toDataURL('image/png'));
        }
      }
    };
    img.onerror = () => {
      setError(true);
    };
    img.src = url;
  }, [text, size]);

  return { canvasRef, dataUrl, error };
}

export default function QRCodeDialog({ open, onClose, sessionId, fileName }: QRCodeDialogProps) {
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const payload = open ? encodeQRPayload(sessionId) : '';
  const { canvasRef, dataUrl, error } = useQRCanvas(payload, 280);

  // Reset timer when dialog opens
  useEffect(() => {
    if (open) {
      setSecondsLeft(QR_EXPIRY_SECONDS);
      setExpired(false);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open || expired) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, expired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = (secondsLeft / QR_EXPIRY_SECONDS) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="mx-4 rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="w-5 h-5 text-primary" />
            Share via QR Code
          </DialogTitle>
          {fileName && (
            <DialogDescription className="text-sm truncate">
              {fileName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Hidden canvas for rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {expired ? (
            <div className="w-[280px] h-[280px] rounded-xl bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-destructive font-semibold text-base">QR Code Expired</p>
              <p className="text-muted-foreground text-sm text-center px-4">
                This QR code has expired. Close and try again.
              </p>
            </div>
          ) : error ? (
            <div className="w-[280px] h-[280px] rounded-xl bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center px-4">
                Could not generate QR code. Check your internet connection.
              </p>
              <p className="text-xs text-muted-foreground font-mono break-all px-4 text-center">
                Session: {sessionId.slice(0, 16)}...
              </p>
            </div>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt="QR Code"
              className="w-[280px] h-[280px] rounded-xl border border-border"
            />
          ) : (
            <div className="w-[280px] h-[280px] rounded-xl bg-muted flex items-center justify-center border border-border">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Generating QR code...</p>
              </div>
            </div>
          )}

          {/* Timer */}
          {!expired && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Expires in</span>
                </div>
                <span
                  className={`font-mono font-semibold ${
                    secondsLeft < 60 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {timeDisplay}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    secondsLeft < 60 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Ask the receiver to scan this QR code to receive the file
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full h-12 text-base rounded-xl"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
