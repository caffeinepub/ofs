import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Image as ImageIcon,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ChevronDown } from "lucide-react";
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

  // --- Compression state ---
  const [compressionQuality, setCompressionQuality] = useState([80]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResultOpen, setCompressionResultOpen] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);

  // --- Recognition state ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recognitionResult, setRecognitionResult] =
    useState<FileRecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResultOpen, setRecognitionResultOpen] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // ---- Compression handlers ----

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setCompressedImage(null);
      setCompressionResultOpen(false);
      setCompressionError(null);
    }
  };

  const handleCompress = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsCompressing(true);
    setCompressionError(null);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(selectedImage);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas toBlob returned null"));
          },
          "image/jpeg",
          compressionQuality[0] / 100,
        );
      });

      // Preserve original extension in name but mark as compressed
      const baseName = selectedImage.name.replace(/\.[^.]+$/, "");
      const compressedFile = new File([blob], `${baseName}_compressed.jpg`, {
        type: "image/jpeg",
      });

      setCompressedImage(compressedFile);
      setCompressionResultOpen(true);

      const originalKB = (selectedImage.size / 1024).toFixed(1);
      const compressedKB = (compressedFile.size / 1024).toFixed(1);
      const savings = (
        ((selectedImage.size - compressedFile.size) / selectedImage.size) *
        100
      ).toFixed(1);

      toast.success("Image compressed! Sending to Transfer tab…", {
        description: `${originalKB} KB → ${compressedKB} KB (${savings}% smaller)`,
      });

      // Automatically send to Transfer tab
      setPendingFile(compressedFile);
      onNavigateToTransfer?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Compression failed";
      setCompressionError(msg);
      toast.error("Compression failed", { description: msg });
    } finally {
      setIsCompressing(false);
    }
  };

  // ---- Recognition handlers ----

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRecognitionResult(null);
    setRecognitionResultOpen(false);
    setRecognitionError(null);

    // Auto-recognize on file selection
    setIsRecognizing(true);
    try {
      const result = await recognizeFile(file);
      setRecognitionResult(result);
      setRecognitionResultOpen(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to recognize file";
      setRecognitionError(msg);
      toast.error("File recognition failed", { description: msg });
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Features</h2>
        <p className="text-sm text-muted-foreground">
          Compress images and identify file types
        </p>
      </div>

      {/* ── Image Compression ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Compression
          </CardTitle>
          <CardDescription>
            Reduce image file size while preserving quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quality-slider" className="text-base">
              Quality: {compressionQuality[0]}%
            </Label>
            <Slider
              id="quality-slider"
              value={compressionQuality}
              onValueChange={setCompressionQuality}
              min={10}
              max={100}
              step={5}
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower quality = smaller file size
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="image-input"
          />
          <label htmlFor="image-input">
            <Button asChild variant="outline" className="w-full h-14 text-base">
              <span>
                <ImageIcon className="mr-2 h-5 w-5" />
                {selectedImage ? selectedImage.name : "Choose Image"}
              </span>
            </Button>
          </label>

          {selectedImage && (
            <p className="text-xs text-muted-foreground text-center">
              Original size: {(selectedImage.size / 1024).toFixed(1)} KB
            </p>
          )}

          <Button
            onClick={handleCompress}
            disabled={!selectedImage || isCompressing}
            className="w-full h-14 text-base"
          >
            {isCompressing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Compressing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Compress Image
              </>
            )}
          </Button>

          {compressionError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {compressionError}
            </div>
          )}

          {compressedImage && !compressionError && (
            <Collapsible
              open={compressionResultOpen}
              onOpenChange={setCompressionResultOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Compression Complete
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${compressionResultOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original</span>
                      <span className="font-medium">
                        {(selectedImage!.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compressed</span>
                      <span className="font-medium">
                        {(compressedImage.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Space saved</span>
                      <span className="font-semibold text-green-600">
                        {(
                          ((selectedImage!.size - compressedImage.size) /
                            selectedImage!.size) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Output file</span>
                      <span className="font-medium text-xs truncate max-w-[160px]">
                        {compressedImage.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* ── File Recognition ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            File Recognition
          </CardTitle>
          <CardDescription>
            Identify file type using magic-byte detection — no guessing from
            extension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button asChild variant="outline" className="w-full h-14 text-base">
              <span>
                <FileSearch className="mr-2 h-5 w-5" />
                {selectedFile ? selectedFile.name : "Choose Any File"}
              </span>
            </Button>
          </label>

          {isRecognizing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing file…
            </div>
          )}

          {recognitionError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {recognitionError}
            </div>
          )}

          {recognitionResult && !isRecognizing && (
            <Collapsible
              open={recognitionResultOpen}
              onOpenChange={setRecognitionResultOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {recognitionResult.isUnknown
                      ? "Unknown File Type"
                      : `Detected: ${recognitionResult.detectedFormat}`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${recognitionResultOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    {recognitionResult.isUnknown ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>
                          Could not identify this file from its content. The
                          format may be proprietary or the file may be
                          corrupted.
                        </span>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Format</span>
                      <span className="font-semibold">
                        <Badge variant="secondary" className="text-xs">
                          {recognitionResult.detectedFormat}
                        </Badge>
                      </span>

                      <span className="text-muted-foreground">MIME type</span>
                      <span className="font-mono text-xs break-all">
                        {recognitionResult.mimeType}
                      </span>

                      <span className="text-muted-foreground">File size</span>
                      <span className="font-medium">
                        {recognitionResult.fileSizeFormatted}
                      </span>

                      {recognitionResult.isImage &&
                      recognitionResult.width &&
                      recognitionResult.height ? (
                        <>
                          <span className="text-muted-foreground">
                            Dimensions
                          </span>
                          <span className="font-medium">
                            {recognitionResult.width} ×{" "}
                            {recognitionResult.height} px
                          </span>
                        </>
                      ) : null}

                      <span className="text-muted-foreground">Detection</span>
                      <span className="text-xs text-muted-foreground">
                        {recognitionResult.isUnknown
                          ? "Extension fallback"
                          : "Magic bytes"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}

          {!selectedFile && !isRecognizing && (
            <p className="text-xs text-center text-muted-foreground">
              Select any file to instantly identify its true format
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
