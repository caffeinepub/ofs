import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    QRCode: {
      toCanvas: (
        canvas: HTMLCanvasElement,
        data: string,
        options?: object,
      ) => Promise<void>;
    };
  }
}

const QR_LIB_URL =
  "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js";

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({
  data,
  size = 260,
  className = "",
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderQR = async () => {
      if (!window.QRCode) {
        await new Promise<void>((resolve, reject) => {
          if (window.QRCode) {
            resolve();
            return;
          }
          const s = document.createElement("script");
          s.src = QR_LIB_URL;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("QR lib load failed"));
          document.head.appendChild(s);
        });
      }

      if (cancelled || !canvasRef.current) return;

      await window.QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });

      if (!cancelled) setStatus("ready");
    };

    setStatus("loading");
    renderQR().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
    };
  }, [data, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (status === "error") {
    return (
      <div className={`flex flex-col gap-3 w-full ${className}`}>
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-2">
            📋 QR unavailable — copy &amp; paste this code:
          </p>
          <textarea
            readOnly
            value={data}
            className="w-full text-xs font-mono bg-background rounded-lg p-3 border border-border resize-none text-foreground"
            rows={5}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                (e.target as HTMLTextAreaElement).select();
              }
            }}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {status === "loading" && (
        <div
          style={{ width: size, height: size }}
          className="rounded-2xl bg-muted animate-pulse"
        />
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-2xl border-4 border-white shadow-xl ${status !== "ready" ? "hidden" : ""}`}
      />
      {status === "ready" && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy as text instead"}
        </button>
      )}
    </div>
  );
}
