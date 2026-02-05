import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileIcon, Package, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { exportOfflineSharePackage, importOfflineSharePackage, OfflinePackageData } from '../utils/offlineSharePackage';
import { saveToDevice } from '../utils/saveToDevice';

export default function OfflineFileShare() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedPackage, setImportedPackage] = useState<OfflinePackageData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportedPackage(null);
    }
  };

  const handleExportPackage = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsExporting(true);
    try {
      await exportOfflineSharePackage(selectedFile);
      toast.success('Offline Share Package exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export package');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const packageFile = e.target.files[0];
    setIsImporting(true);

    try {
      const packageData = await importOfflineSharePackage(packageFile);
      setImportedPackage(packageData);
      setSelectedFile(null);
      toast.success(`Package imported: ${packageData.fileName}`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import package. Please ensure it is a valid Offline Share Package.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveToDevice = async () => {
    if (!importedPackage) return;

    try {
      // Convert Uint8Array to regular array for Blob constructor
      const byteArray = Array.from(importedPackage.fileBytes);
      const blob = new Blob([new Uint8Array(byteArray)], { type: importedPackage.fileType });
      await saveToDevice(blob, importedPackage.fileName, importedPackage.fileType);
      toast.success('File saved to device!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export File</CardTitle>
          <CardDescription>Create an Offline Share Package to send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors">
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Click to select a file</p>
                <p className="text-sm text-muted-foreground">Any file type supported</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>

              <Button onClick={handleExportPackage} disabled={isExporting} className="w-full" size="lg">
                {isExporting ? (
                  <>
                    <Package className="mr-2 h-4 w-4 animate-pulse" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Export Offline Share Package
                  </>
                )}
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The exported package is a self-contained HTML file that can be opened offline by the receiver.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Package</CardTitle>
          <CardDescription>Open a received Offline Share Package</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors">
            <input
              type="file"
              accept=".html"
              onChange={handleImportPackage}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Click to import package</p>
                <p className="text-sm text-muted-foreground">Select .html package file</p>
              </div>
            </div>
          </div>

          {isImporting && (
            <Alert>
              <AlertCircle className="h-4 w-4 animate-pulse" />
              <AlertDescription>Importing package...</AlertDescription>
            </Alert>
          )}

          {importedPackage && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{importedPackage.fileName}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(importedPackage.fileSize)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Type: {importedPackage.fileType || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveToDevice} className="w-full" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Save to Device
              </Button>

              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Package imported successfully! Click "Save to Device" to download the file.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
