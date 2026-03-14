import { Slider } from "@/components/ui/slider";
import {
  CheckCircle2,
  FileSearch,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTransfer } from "../contexts/TransferContext";
import {
  type FileRecognitionResult,
  recognizeFile,
} from "../utils/fileRecognition";

interface AIFeaturesProps {
  onNavigateToTransfer?: () => void;
}

export default function AIFeatures({ onNavigateToTransfer }: AIFeaturesProps) {
  const { setPendingFile } = useTransfer();

  // Compression
  const [quality, setQuality] = useState([80]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    original: number;
    compressed: number;
  } | null>(null);

  // Recognition
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recResult, setRecResult] = useState<FileRecognitionResult | null>(
    null,
  );
  const [isRecognizing, setIsRecognizing] = useState(false);

  const handleCompress = async () => {
    if (!selectedImage) return;
    setIsCompressing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
        img.src = URL.createObjectURL(selectedImage);
      });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((res, rej) => {
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
          "image/jpeg",
          quality[0] / 100,
        );
      });
      const baseName = selectedImage.name.replace(/\.[^.]+$/, "");
      const compressed = new File([blob], `${baseName}_compressed.jpg`, {
        type: "image/jpeg",
      });
      setCompressionStats({
        original: selectedImage.size,
        compressed: compressed.size,
      });
      const savings = (
        ((selectedImage.size - compressed.size) / selectedImage.size) *
        100
      ).toFixed(1);
      toast.success("Compressed! Sending to Transfer tab\u2026", {
        description: `${(selectedImage.size / 1024).toFixed(1)} KB \u2192 ${(compressed.size / 1024).toFixed(1)} KB (${savings}% saved)`,
      });
      // Auto-navigate to Transfer
      setPendingFile(compressed);
      onNavigateToTransfer?.();
    } catch (err) {
      toast.error("Compression failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRecognize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setRecResult(null);
    setIsRecognizing(true);
    try {
      const result = await recognizeFile(f);
      setRecResult(result);
    } catch {
      toast.error("Recognition failed");
    } finally {
      setIsRecognizing(false);
    }
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "4px",
        }}
      >
        <Sparkles
          style={{ width: "22px", height: "22px", color: "var(--primary)" }}
        />
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--foreground)",
          }}
        >
          AI Features
        </h2>
      </div>

      {/* Image Compression */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ImageIcon
              style={{ width: "18px", height: "18px", color: "var(--primary)" }}
            />
            <p
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--foreground)",
              }}
            >
              Image Compression
            </p>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted-foreground)",
              marginTop: "3px",
            }}
          >
            Reduce image size before sharing
          </p>
        </div>
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              Quality: {quality[0]}%
            </p>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={10}
              max={100}
              step={5}
            />
            <p
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
                marginTop: "4px",
              }}
            >
              Lower = smaller file size
            </p>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px",
              borderRadius: "12px",
              border: "2px dashed var(--border)",
              backgroundColor: "var(--muted)",
              cursor: "pointer",
              color: selectedImage
                ? "var(--foreground)"
                : "var(--muted-foreground)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setSelectedImage(f);
                  setCompressionStats(null);
                }
                e.target.value = "";
              }}
            />
            {selectedImage ? selectedImage.name : "Select image"}
          </label>

          {compressionStats && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(22,163,74,0.08)",
                border: "1px solid rgba(22,163,74,0.2)",
                alignItems: "center",
              }}
            >
              <CheckCircle2
                style={{
                  width: "16px",
                  height: "16px",
                  color: "#16a34a",
                  flexShrink: 0,
                }}
              />
              <p
                style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}
              >
                {(compressionStats.original / 1024).toFixed(1)} KB \u2192{" "}
                {(compressionStats.compressed / 1024).toFixed(1)} KB (
                {(
                  (1 -
                    compressionStats.compressed / compressionStats.original) *
                  100
                ).toFixed(1)}
                % saved)
              </p>
            </div>
          )}

          <button
            type="button"
            data-ocid="ai.compress.primary_button"
            onClick={handleCompress}
            disabled={!selectedImage || isCompressing}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: "15px",
              fontWeight: 700,
              cursor:
                !selectedImage || isCompressing ? "not-allowed" : "pointer",
              opacity: !selectedImage ? 0.5 : 1,
              width: "100%",
            }}
          >
            {isCompressing ? (
              <Loader2
                style={{
                  width: "18px",
                  height: "18px",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <ImageIcon style={{ width: "18px", height: "18px" }} />
            )}
            {isCompressing ? "Compressing\u2026" : "Compress Image"}
          </button>
        </div>
      </div>

      {/* File Recognition */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileSearch
              style={{ width: "18px", height: "18px", color: "var(--primary)" }}
            />
            <p
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--foreground)",
              }}
            >
              File Recognition
            </p>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted-foreground)",
              marginTop: "3px",
            }}
          >
            Identify file type and category
          </p>
        </div>
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px",
              borderRadius: "12px",
              border: "2px dashed var(--border)",
              backgroundColor: "var(--muted)",
              cursor: "pointer",
              color: selectedFile
                ? "var(--foreground)"
                : "var(--muted-foreground)",
              fontSize: "14px",
              fontWeight: 600,
            }}
            data-ocid="ai.recognize.upload_button"
          >
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleRecognize}
            />
            {isRecognizing
              ? "Recognizing\u2026"
              : selectedFile
                ? selectedFile.name
                : "Select any file"}
          </label>

          {recResult && (
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--muted)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--muted-foreground)",
                    minWidth: "70px",
                  }}
                >
                  Category
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  {recResult.category}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--muted-foreground)",
                    minWidth: "70px",
                  }}
                >
                  Type
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  {recResult.mimeType}
                </span>
              </div>
              {recResult.description && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--muted-foreground)",
                      minWidth: "70px",
                    }}
                  >
                    Info
                  </span>
                  <span
                    style={{ fontSize: "13px", color: "var(--foreground)" }}
                  >
                    {recResult.description}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
