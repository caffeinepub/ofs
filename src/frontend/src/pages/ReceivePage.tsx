import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  SwitchCamera,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useLocalHistory } from "../hooks/useLocalHistory";
import { useQRScanner } from "../qr-code/useQRScanner";
import { parseQRPayload } from "../utils/qrPayload";

type Step = "scanning" | "processing" | "done" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReceivePage() {
  const navigate = useNavigate();
  const { addReceived } = useLocalHistory();
  const { actor } = useActor();

  const [step, setStep] = useState<Step>("scanning");
  const [scanError, setScanError] = useState<string | null>(null);
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
  const { startScanning, stopScanning, clearResults } = scanner;

  useEffect(() => {
    processedRef.current = null;
    clearResults();
    const t = setTimeout(() => startScanning(), 300);
    return () => {
      clearTimeout(t);
      stopScanning();
    };
  }, [clearResults, startScanning, stopScanning]);

  const handleSuccessfulScan = useCallback(
    async (sessionId: string) => {
      setStep("processing");
      setScanError(null);
      stopScanning();

      try {
        let fileName = `file-${sessionId.slice(0, 8)}`;
        let fileSize = 0;
        let fileType = "application/octet-stream";

        if (actor) {
          try {
            const meta = await actor.getFileMetadata(sessionId);
            if (meta) {
              fileName = meta.name;
              fileSize = Number(meta.size);
              fileType = meta.fileType;

              // Download and trigger save
              const bytes = await meta.blob.getBytes();
              const blob = new Blob([bytes], { type: fileType });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 3000);
            }
          } catch {
            // metadata fetch failed, use defaults
          }
        }

        addReceived({
          id: sessionId,
          fileName,
          fileSize,
          fileType,
          peerName: "QR Scan",
          timestamp: Date.now(),
        });

        setReceivedInfo({ fileName, fileSize, fileType });
        setStep("done");
        toast.success("File received!", { description: fileName });
      } catch (err) {
        setStep("error");
        toast.error("Receive failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [actor, addReceived, stopScanning],
  );

  useEffect(() => {
    if (!scanner.qrResults.length || step !== "scanning") return;
    const latest = scanner.qrResults[0];
    if (processedRef.current === latest.data) return;
    processedRef.current = latest.data;

    const sessionId = parseQRPayload(latest.data);
    if (!sessionId) {
      setScanError("Invalid QR code. Please scan a valid OFS sharing QR.");
      processedRef.current = null;
      return;
    }
    handleSuccessfulScan(sessionId);
  }, [scanner.qrResults, step, handleSuccessfulScan]);

  const goToReceived = () => navigate({ to: "/" });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "env(safe-area-inset-top, 16px) 16px 16px",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          data-ocid="receive.cancel_button"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <ArrowLeft style={{ width: "22px", height: "22px" }} />
        </button>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>
          Scan QR Code
        </p>
        {scanner.isActive && (
          <button
            type="button"
            onClick={() => scanner.switchCamera()}
            data-ocid="receive.toggle"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <SwitchCamera style={{ width: "22px", height: "22px" }} />
          </button>
        )}
        {!scanner.isActive && <div style={{ width: "44px" }} />}
      </div>

      {/* Camera Feed */}
      <video
        ref={scanner.videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <canvas ref={scanner.canvasRef} style={{ display: "none" }} />

      {/* Viewfinder */}
      {step === "scanning" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ position: "relative", width: "260px", height: "260px" }}
          >
            {/* Corners */}
            {["top-left", "top-right", "bottom-left", "bottom-right"].map(
              (c) => (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    width: "36px",
                    height: "36px",
                    borderColor: "#fff",
                    borderStyle: "solid",
                    borderWidth: 0,
                    ...(c.includes("top")
                      ? { top: 0, borderTopWidth: "3px" }
                      : { bottom: 0, borderBottomWidth: "3px" }),
                    ...(c.includes("left")
                      ? { left: 0, borderLeftWidth: "3px" }
                      : { right: 0, borderRightWidth: "3px" }),
                  }}
                />
              ),
            )}
            {/* Scan line */}
            <div
              className="animate-scan-line"
              style={{ backgroundColor: "#38bdf8", opacity: 0.85 }}
            />
          </div>
        </div>
      )}

      {/* Loading state */}
      {scanner.isLoading && step === "scanning" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <Loader2
            style={{
              width: "36px",
              height: "36px",
              color: "#fff",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#fff", fontSize: "15px" }}>Starting camera…</p>
        </div>
      )}

      {/* Error state */}
      {scanner.error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            padding: "32px",
            backgroundColor: "rgba(0,0,0,0.8)",
          }}
        >
          <AlertCircle
            style={{ width: "48px", height: "48px", color: "#ef4444" }}
          />
          <p
            style={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Camera Error
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {scanner.error?.message}
          </p>
          <button
            type="button"
            onClick={() => scanner.retry()}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#fff",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Processing state */}
      {step === "processing" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          <Loader2
            style={{
              width: "48px",
              height: "48px",
              color: "#38bdf8",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#fff", fontSize: "17px", fontWeight: 700 }}>
            Receiving file…
          </p>
        </div>
      )}

      {/* Success state */}
      {step === "done" && receivedInfo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "32px",
            backgroundColor: "rgba(0,0,0,0.9)",
          }}
        >
          <CheckCircle
            style={{ width: "64px", height: "64px", color: "#22c55e" }}
          />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#fff",
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "6px",
              }}
            >
              File Received!
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
              {receivedInfo.fileName}
            </p>
            {receivedInfo.fileSize > 0 && (
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                {formatBytes(receivedInfo.fileSize)}
              </p>
            )}
          </div>
          <button
            type="button"
            data-ocid="receive.success_state"
            onClick={goToReceived}
            style={{
              padding: "16px 32px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "#22c55e",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            View in History
          </button>
        </div>
      )}

      {/* Scan error */}
      {scanError && step === "scanning" && (
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "16px",
            right: "16px",
            padding: "12px 16px",
            borderRadius: "12px",
            backgroundColor: "rgba(239,68,68,0.9)",
          }}
        >
          <p style={{ color: "#fff", fontSize: "14px", textAlign: "center" }}>
            {scanError}
          </p>
        </div>
      )}

      {/* Bottom hint */}
      {step === "scanning" && !scanError && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px 16px",
            paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
            Point camera at the sender's QR code
          </p>
        </div>
      )}
    </div>
  );
}
