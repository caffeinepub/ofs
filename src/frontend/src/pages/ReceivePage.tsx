import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle,
  FileIcon,
  Loader2,
  SwitchCamera,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useLocalHistory } from "../hooks/useLocalHistory";
import { useQRScanner } from "../qr-code/useQRScanner";
import { parseQRPayload } from "../utils/qrPayload";

type ReceiveStep = "scanning" | "processing" | "done" | "error";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReceivePage() {
  const navigate = useNavigate();
  const { triggerSuccess } = useHapticFeedback();
  const { addReceived } = useLocalHistory();
  const { actor } = useActor();

  const [step, setStep] = useState<ReceiveStep>("scanning");
  const [scanError, setScanError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receivedInfo, setReceivedInfo] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const processedRef = useRef<string | null>(null);

  const scanner = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 5,
  });

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const { startScanning, stopScanning, clearResults } = scanner;

  // Auto-start scanner on mount
  useEffect(() => {
    processedRef.current = null;
    clearResults();
    const timer = setTimeout(() => {
      startScanning();
    }, 300);
    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, [clearResults, startScanning, stopScanning]);

  // Handle scanned QR results
  useEffect(() => {
    if (!scanner.qrResults.length || step !== "scanning") return;
    const latest = scanner.qrResults[0];
    if (processedRef.current === latest.data) return;
    processedRef.current = latest.data;

    const sessionId = parseQRPayload(latest.data);
    if (!sessionId) {
      setScanError(
        "Invalid QR code. Please scan a valid file sharing QR code.",
      );
      processedRef.current = null;
      return;
    }

    handleSuccessfulScan(sessionId);
  }, [scanner.qrResults, step]);

  const handleSuccessfulScan = async (sessionId: string) => {
    setStep("processing");
    setScanError(null);
    stopScanning();

    try {
      triggerSuccess();

      let fileName = `file-${sessionId.slice(0, 8)}`;
      let fileSize = 0;
      let fileType = "application/octet-stream";

      if (actor) {
        try {
          const metadata = await actor.getFileMetadata(sessionId);
          if (metadata) {
            fileName = metadata.name || fileName;
            fileSize = metadata.size ? Number(metadata.size) : 0;
            fileType = metadata.fileType || fileType;

            // Download file to device using ExternalBlob
            try {
              const bytes = await metadata.blob.getBytes();
              const safeBytes = new Uint8Array(bytes.buffer as ArrayBuffer);
              const downloadBlob = new Blob([safeBytes], { type: fileType });
              const url = URL.createObjectURL(downloadBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 5000);
              fileSize = bytes.length;
            } catch (downloadErr) {
              console.warn("Could not download file bytes:", downloadErr);
            }
          }
        } catch (e) {
          console.warn("Could not fetch file from backend:", e);
        }
      }

      const recordId = `recv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addReceived({
        id: recordId,
        fileName,
        fileSize,
        fileType,
        peerName: "Via QR Scan",
        timestamp: Date.now(),
      });

      setReceivedInfo({ fileName, fileSize, fileType });
      setStep("done");
    } catch (e) {
      console.error("Error processing QR scan:", e);
      setErrorMessage("Failed to receive the file. Please try again.");
      setStep("error");
    }
  };

  const handleScanAgain = () => {
    setStep("scanning");
    setScanError(null);
    setErrorMessage(null);
    setReceivedInfo(null);
    processedRef.current = null;
    clearResults();
    startScanning();
  };

  const handleBack = () => {
    stopScanning();
    navigate({ to: "/" });
  };

  const handleDone = () => {
    stopScanning();
    toast.success("File saved to received history!");
    navigate({ to: "/" });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-black/80">
        <button
          type="button"
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="Go back"
          data-ocid="receive.back.button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-lg font-semibold">Receive File</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 gap-5 overflow-y-auto pt-4 pb-8">
        {/* STEP: Scanning */}
        {step === "scanning" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="text-center">
              <h3 className="text-white text-xl font-bold">Scan QR Code</h3>
              <p className="text-white/60 text-sm mt-1">
                Point your camera at the sender's QR code
              </p>
            </div>

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-900">
              <video
                ref={scanner.videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={scanner.canvasRef} className="hidden" />

              {scanner.isActive && (
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

              {scanner.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                </div>
              )}

              {!scanner.isActive && !scanner.isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-12 h-12 text-white/40" />
                  <button
                    type="button"
                    onClick={scanner.startScanning}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>

            {(scanError || scanner.error) && (
              <div className="flex items-start gap-2 bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 w-full">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">
                  {scanError ?? scanner.error?.message ?? "Camera error"}
                </p>
              </div>
            )}

            {isMobile && scanner.isActive && (
              <Button
                variant="outline"
                onClick={scanner.switchCamera}
                className="w-full h-11 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <SwitchCamera className="w-4 h-4 mr-2" />
                Switch Camera
              </Button>
            )}
          </div>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-bold">Receiving File...</p>
              <p className="text-white/60 text-sm mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === "done" && receivedInfo && (
          <div className="flex flex-col items-center gap-5 w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-bold">File Received!</p>
              <p className="text-white/60 text-sm mt-1">
                The file has been saved to your device.
              </p>
            </div>

            <div className="w-full bg-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <FileIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {receivedInfo.fileName}
                </p>
                {receivedInfo.fileSize > 0 && (
                  <p className="text-white/60 text-sm mt-0.5">
                    {formatFileSize(receivedInfo.fileSize)}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleDone}
              className="w-full h-14 text-base rounded-2xl"
              data-ocid="receive.save_button"
            >
              Done
            </Button>

            <Button
              variant="outline"
              onClick={handleScanAgain}
              className="w-full h-11 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Receive Another
            </Button>
          </div>
        )}

        {/* STEP: Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-5 w-full max-w-xs">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-bold">Receive Failed</p>
              <p className="text-white/60 text-sm mt-1">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
            </div>
            <Button
              onClick={handleScanAgain}
              className="w-full h-14 text-base rounded-2xl"
              data-ocid="receive.retry.button"
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full h-11 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
