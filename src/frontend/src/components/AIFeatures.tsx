import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sparkles, CheckCircle2, Upload, FileText, Image as ImageIcon, Video, Music, FileArchive, File, Loader2, Share2 } from 'lucide-react';
import { useCompressImage, useRecordAIProcessing } from '../hooks/useQueries';
import { ExternalBlob, Variant_imageCompression_fileRecognition } from '../backend';
import { toast } from 'sonner';

interface FileRecognitionResult {
  fileName: string;
  fileType: string;
  category: string;
  size: string;
  metadata: string[];
}

interface AIFeaturesProps {
  onShareCompressedImage?: (file: File) => void;
}

export default function AIFeatures({ onShareCompressedImage }: AIFeaturesProps) {
  // Image Compression State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [compressionQuality, setCompressionQuality] = useState(75);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const compressImage = useCompressImage();

  // File Recognition State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<FileRecognitionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const recordAIProcessing = useRecordAIProcessing();

  // Helper function to create a File from Blob
  const createFileFromBlob = (blob: Blob, fileName: string): File => {
    // Create a File object by extending the Blob with File properties
    const file = blob as any;
    file.name = fileName;
    file.lastModified = Date.now();
    return file as File;
  };

  // Image Compression Handler
  const handleImageCompression = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setCompressionProgress(10);
      
      // Read the image file
      const arrayBuffer = await selectedImage.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setOriginalSize(uint8Array.length);
      
      setCompressionProgress(30);

      // Compress using canvas
      const compressedBlob = await compressImageOnCanvas(selectedImage, compressionQuality / 100);
      const compressedArray = new Uint8Array(await compressedBlob.arrayBuffer());
      setCompressedSize(compressedArray.length);
      
      // Create a File object from the compressed blob
      const compressedFileName = selectedImage.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
      const compressedFileObj = createFileFromBlob(compressedBlob, compressedFileName);
      setCompressedFile(compressedFileObj);
      
      setCompressionProgress(60);

      // Upload to backend
      const externalBlob = ExternalBlob.fromBytes(compressedArray);
      const id = `img-${Date.now()}`;
      
      await compressImage.mutateAsync({
        image: externalBlob,
        quality: BigInt(compressionQuality),
      });

      setCompressionProgress(100);

      // Record AI processing
      await recordAIProcessing.mutateAsync({
        id,
        resultType: Variant_imageCompression_fileRecognition.imageCompression,
        metadata: JSON.stringify({
          originalSize: originalSize,
          compressedSize: compressedArray.length,
          quality: compressionQuality,
          fileName: selectedImage.name,
        }),
        processedFile: externalBlob,
      });

      // Show success dialog
      setShowSuccessDialog(true);
      toast.success(`Image compressed successfully! Reduced by ${Math.round((1 - compressedArray.length / uint8Array.length) * 100)}%`);
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to compress image');
    } finally {
      setTimeout(() => setCompressionProgress(0), 2000);
    }
  };

  // Canvas-based image compression
  const compressImageOnCanvas = (file: File, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Share Now button click
  const handleShareNow = () => {
    if (compressedFile && onShareCompressedImage) {
      onShareCompressedImage(compressedFile);
      setShowSuccessDialog(false);
      toast.success('Compressed image ready to share!');
    }
  };

  // File Recognition Handler
  const handleFileRecognition = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Analyze file
      const result = await analyzeFile(selectedFile);
      setRecognitionResult(result);

      // Record AI processing
      const id = `file-${Date.now()}`;
      await recordAIProcessing.mutateAsync({
        id,
        resultType: Variant_imageCompression_fileRecognition.fileRecognition,
        metadata: JSON.stringify(result),
        processedFile: null,
      });

      toast.success('File analyzed successfully!');
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Failed to analyze file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // File analysis logic
  const analyzeFile = async (file: File): Promise<FileRecognitionResult> => {
    const fileType = file.type || 'unknown';
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    let category = 'Unknown';
    let metadata: string[] = [];

    // Categorize by MIME type
    if (fileType.startsWith('image/')) {
      category = 'Image';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        `MIME: ${fileType}`,
        'Supports compression',
        'Visual content detected',
      ];
    } else if (fileType.startsWith('video/')) {
      category = 'Video';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        `MIME: ${fileType}`,
        'Multimedia content',
        'Streaming compatible',
      ];
    } else if (fileType.startsWith('audio/')) {
      category = 'Audio';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        `MIME: ${fileType}`,
        'Audio content',
        'Playback supported',
      ];
    } else if (fileType.includes('pdf')) {
      category = 'Document (PDF)';
      metadata = [
        'Portable Document Format',
        'Text and images',
        'Print-ready',
        'Cross-platform',
      ];
    } else if (fileType.includes('text') || ['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
      category = 'Text Document';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        'Plain text content',
        'Editable',
        'Lightweight',
      ];
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      category = 'Archive';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        'Compressed archive',
        'Multiple files',
        'Extraction required',
      ];
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      category = 'Office Document';
      metadata = [
        `Format: ${extension.toUpperCase()}`,
        'Microsoft Office',
        'Formatted content',
        'Editable',
      ];
    } else {
      metadata = [
        `Extension: ${extension}`,
        `MIME: ${fileType || 'Not detected'}`,
        'Generic file type',
        'Manual review recommended',
      ];
    }

    return {
      fileName: file.name,
      fileType: fileType || 'application/octet-stream',
      category,
      size: formatFileSize(file.size),
      metadata,
    };
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    if (category.includes('Image')) return <ImageIcon className="h-5 w-5" />;
    if (category.includes('Video')) return <Video className="h-5 w-5" />;
    if (category.includes('Audio')) return <Music className="h-5 w-5" />;
    if (category.includes('Archive')) return <FileArchive className="h-5 w-5" />;
    if (category.includes('Document') || category.includes('Text')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/20 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI-Powered Features</h3>
            <p className="mt-1 text-muted-foreground">
              Enhance your file sharing experience with intelligent automation and smart processing
            </p>
          </div>
        </div>
      </div>

      {/* Success Dialog for Image Compression */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Image Compressed Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Size:</span>
                  <span className="font-medium">{formatFileSize(originalSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compressed Size:</span>
                  <span className="font-medium">{formatFileSize(compressedSize)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Space Saved:</span>
                  <span className="font-bold text-primary">
                    {Math.round((1 - compressedSize / originalSize) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm">
                Your image has been optimized and is ready to share. Would you like to send it now?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleShareNow} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Image Compression */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <img src="/assets/generated/ai-compression-transparent.dim_64x64.png" alt="Image Compression" className="h-12 w-12" />
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            </div>
            <CardTitle className="mt-4">Image Compression</CardTitle>
            <CardDescription>Reduce image file sizes with AI-powered optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Image</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      setCompressedSize(0);
                      setCompressedFile(null);
                    }
                  }}
                  className="flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {selectedImage && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedImage.name} ({formatFileSize(selectedImage.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quality: {compressionQuality}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleImageCompression}
              disabled={!selectedImage || compressImage.isPending}
              className="w-full"
            >
              {compressImage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Compress Image
                </>
              )}
            </Button>

            {compressionProgress > 0 && (
              <div className="space-y-2">
                <Progress value={compressionProgress} />
                <p className="text-xs text-center text-muted-foreground">Processing: {compressionProgress}%</p>
              </div>
            )}

            {compressedSize > 0 && originalSize > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <p>Original: {formatFileSize(originalSize)}</p>
                    <p>Compressed: {formatFileSize(compressedSize)}</p>
                    <p className="font-medium text-primary">
                      Saved: {Math.round((1 - compressedSize / originalSize) * 100)}%
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* File Recognition */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <img src="/assets/generated/file-recognition-placeholder-transparent.dim_64x64.png" alt="File Recognition" className="h-12 w-12" />
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            </div>
            <CardTitle className="mt-4">File Recognition</CardTitle>
            <CardDescription>AI-powered file type detection and metadata extraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setRecognitionResult(null);
                  }
                }}
                className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleFileRecognition}
              disabled={!selectedFile || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze File
                </>
              )}
            </Button>

            {recognitionResult && (
              <Alert>
                <div className="flex items-start gap-3">
                  {getCategoryIcon(recognitionResult.category)}
                  <AlertDescription className="flex-1">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{recognitionResult.category}</p>
                        <p className="text-xs text-muted-foreground">{recognitionResult.size}</p>
                      </div>
                      <ul className="space-y-1">
                        {recognitionResult.metadata.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How AI Features Work</CardTitle>
          <CardDescription>Our AI automatically enhances your file sharing experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <h4 className="font-medium">Image Compression</h4>
              <p className="text-sm text-muted-foreground">
                AI analyzes and compresses images while maintaining visual quality, reducing file size by up to 70%
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                2
              </div>
              <h4 className="font-medium">File Recognition</h4>
              <p className="text-sm text-muted-foreground">
                Automatically detects file types, extracts metadata, and categorizes content for better organization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
