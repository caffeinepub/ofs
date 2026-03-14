import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createQRPayload } from "../utils/qrPayload";

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export default function QRCodeDialog({
  open,
  onClose,
  fileId,
  fileName,
}: QRCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !fileId || !canvasRef.current) return;

    const payload = createQRPayload(fileId);

    const loadAndRender = async () => {
      if (!(window as any).QRCode) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load QRCode"));
          document.head.appendChild(s);
        });
      }
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          await (window as any).QRCode.toCanvas(canvas, payload, {
            width: 240,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
        }
      } catch (e) {
        console.error("QR generation failed", e);
      }
    };

    loadAndRender();
  }, [open, fileId]);

  if (!open) return null;

  return (
    <dialog
      open
      aria-label="QR Code"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: "24px",
        margin: 0,
        maxWidth: "100%",
        maxHeight: "100%",
        width: "100%",
        height: "100%",
        border: "none",
      }}
    >
      {/* Backdrop close */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "20px",
          padding: "28px 24px",
          width: "100%",
          maxWidth: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          data-ocid="qr.close_button"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
        >
          <X style={{ width: "16px", height: "16px" }} />
        </button>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--foreground)",
            }}
          >
            Scan to Receive
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted-foreground)",
              marginTop: "4px",
              maxWidth: "220px",
            }}
          >
            {fileName}
          </p>
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "12px",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", borderRadius: "6px" }}
          />
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--muted-foreground)",
            textAlign: "center",
          }}
        >
          Valid for 5 minutes \u00b7 Ask receiver to scan
        </p>
      </div>
    </dialog>
  );
}
