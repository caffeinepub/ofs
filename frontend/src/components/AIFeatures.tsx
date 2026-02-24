import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sparkles, Image as ImageIcon, FileSearch, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface AIFeaturesProps {
  onShareCompressedImage?: (file: File) => void;
}

export default function AIFeatures({ onShareCompressedImage }: AIFeaturesProps) {
  const [compressionQuality, setCompressionQuality] = useState([80]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResultOpen, setCompressionResultOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResultOpen, setRecognitionResultOpen] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setCompressedImage(null);
      setCompressionResultOpen(false);
    }
  };

  const handleCompress = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsCompressing(true);

    try {
      // Simulate compression
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(selectedImage);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          'image/jpeg',
          compressionQuality[0] / 100
        );
      });

      const compressedFile = new File([blob], selectedImage.name, {
        type: 'image/jpeg',
      });

      setCompressedImage(compressedFile);
      setCompressionResultOpen(true);

      const originalSize = (selectedImage.size / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024).toFixed(2);
      const savings = (((selectedImage.size - compressedFile.size) / selectedImage.size) * 100).toFixed(1);

      toast.success('Image compressed successfully!', {
        description: `Reduced from ${originalSize} KB to ${compressedSize} KB (${savings}% smaller)`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to compress image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleShareCompressed = () => {
    if (compressedImage && onShareCompressedImage) {
      onShareCompressedImage(compressedImage);
      toast.success('Compressed image ready to share!');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setRecognitionResult(null);
      setRecognitionResultOpen(false);
    }
  };

  const handleRecognize = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsRecognizing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = `File: ${selectedFile.name}\nType: ${selectedFile.type}\nSize: ${(selectedFile.size / 1024).toFixed(2)} KB\n\nThis is a simulated recognition result. In a production environment, this would use actual AI/ML models to analyze the file content.`;

      setRecognitionResult(mockResult);
      setRecognitionResultOpen(true);
      toast.success('File analyzed successfully!');
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Failed to analyze file');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Features</h2>
        <p className="text-sm text-muted-foreground">Compress and analyze your files</p>
      </div>

      {/* Image Compression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Compression
          </CardTitle>
          <CardDescription>Reduce image file size while maintaining quality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quality-slider" className="text-base">
              Compression Quality: {compressionQuality[0]}%
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
                {selectedImage ? selectedImage.name : 'Choose Image'}
              </span>
            </Button>
          </label>

          <Button
            onClick={handleCompress}
            disabled={!selectedImage || isCompressing}
            className="w-full h-14 text-base"
          >
            {isCompressing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Compress Image
              </>
            )}
          </Button>

          {compressedImage && (
            <Collapsible open={compressionResultOpen} onOpenChange={setCompressionResultOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-between">
                  <span>Compression Result</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${compressionResultOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original:</span>
                      <span className="font-medium">{(selectedImage!.size / 1024).toFixed(2)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compressed:</span>
                      <span className="font-medium">{(compressedImage.size / 1024).toFixed(2)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Savings:</span>
                      <span className="font-medium text-green-600">
                        {(((selectedImage!.size - compressedImage.size) / selectedImage!.size) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Button onClick={handleShareCompressed} className="w-full h-12">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Compressed Image
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* File Recognition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            File Recognition
          </CardTitle>
          <CardDescription>Analyze and identify file contents</CardDescription>
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
                {selectedFile ? selectedFile.name : 'Choose File'}
              </span>
            </Button>
          </label>

          <Button
            onClick={handleRecognize}
            disabled={!selectedFile || isRecognizing}
            className="w-full h-14 text-base"
          >
            {isRecognizing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze File
              </>
            )}
          </Button>

          {recognitionResult && (
            <Collapsible open={recognitionResultOpen} onOpenChange={setRecognitionResultOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-between">
                  <span>Analysis Result</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${recognitionResultOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <pre className="text-xs whitespace-pre-wrap font-mono">{recognitionResult}</pre>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
