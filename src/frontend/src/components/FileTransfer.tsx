import { useState, useCallback, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetOnlineUsers, useUploadFile, useRecordTransfer } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileIcon, Loader2, CheckCircle2, QrCode, ScanLine, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import type { FileMetadata } from '../backend';
import QRCodeDialog from './QRCodeDialog';
import QRScannerModal from './QRScannerModal';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'compressing' | 'transferring' | 'complete' | 'error';
  id: string;
}

interface FileTransferProps {
  prefilledFile?: { file: File; source: string } | null;
  onFileProcessed?: () => void;
}

export default function FileTransfer({ prefilledFile, onFileProcessed }: FileTransferProps) {
  const { identity } = useInternetIdentity();
  const { data: onlineUsers } = useGetOnlineUsers();
  const uploadFile = useUploadFile();
  const recordTransfer = useRecordTransfer();
  const isOnline = useOnlineStatus();

  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [fileForQR, setFileForQR] = useState<File | null>(null);

  const isAuthenticated = !!identity;
  const currentUserPrincipal = identity?.getPrincipal().toString();
  const availableReceivers = onlineUsers?.filter((user) => user.toString() !== currentUserPrincipal) || [];

  // Handle prefilled file from AI compression
  useEffect(() => {
    if (prefilledFile) {
      const newFile: FileWithProgress = {
        file: prefilledFile.file,
        progress: 0,
        status: 'pending',
        id: `${Date.now()}-${Math.random()}`,
      };
      setSelectedFiles([newFile]);
      
      if (prefilledFile.source === 'compression') {
        toast.success('Compressed image added! Select a receiver to send.');
      }
      
      if (onFileProcessed) {
        onFileProcessed();
      }
    }
  }, [prefilledFile, onFileProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newFiles: FileWithProgress[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
      id: `${Date.now()}-${Math.random()}`,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendViaQR = () => {
    if (!isAuthenticated) {
      toast.error('Login required for QR code sharing');
      return;
    }

    if (!isOnline) {
      toast.error('This feature requires an internet connection');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    if (selectedFiles.length > 1) {
      toast.error('Please select only one file for QR code sharing');
      return;
    }

    setFileForQR(selectedFiles[0].file);
    setQrDialogOpen(true);
  };

  const handleScanQR = () => {
    if (!isAuthenticated) {
      toast.error('Login required for QR code scanning');
      return;
    }

    if (!isOnline) {
      toast.error('This feature requires an internet connection');
      return;
    }

    setQrScannerOpen(true);
  };

  const handleFileScanned = async (fileMetadata: FileMetadata) => {
    try {
      const blob = await fileMetadata.blob.getBytes();
      const file = new File([blob], fileMetadata.name, { type: fileMetadata.fileType });
      
      const newFile: FileWithProgress = {
        file,
        progress: 100,
        status: 'complete',
        id: fileMetadata.id,
      };
      
      setSelectedFiles([newFile]);
      toast.success(`Received file: ${fileMetadata.name}`);
    } catch (error) {
      console.error('Error processing scanned file:', error);
      toast.error('Failed to receive file');
    }
  };

  const simulateTransfer = async (fileWithProgress: FileWithProgress) => {
    const { file, id } = fileWithProgress;

    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'uploading' as const, progress: 10 } : f))
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (file.type.startsWith('image/')) {
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'compressing' as const, progress: 30 } : f))
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'transferring' as const, progress: 50 } : f))
    );

    for (let i = 50; i <= 90; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setSelectedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: i } : f)));
    }

    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'complete' as const, progress: 100 } : f))
    );
  };

  const handleTransfer = async () => {
    if (!isAuthenticated) {
      toast.error('Login required for online transfers');
      return;
    }

    if (!isOnline) {
      toast.error('This feature requires an internet connection');
      return;
    }

    if (!selectedReceiver) {
      toast.error('Please select a receiver');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select files to transfer');
      return;
    }

    try {
      const startTime = Date.now();

      for (const fileWithProgress of selectedFiles) {
        if (fileWithProgress.status !== 'pending') continue;

        await simulateTransfer(fileWithProgress);

        const arrayBuffer = await fileWithProgress.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array);

        await uploadFile.mutateAsync({
          id: fileWithProgress.id,
          name: fileWithProgress.file.name,
          size: BigInt(fileWithProgress.file.size),
          fileType: fileWithProgress.file.type,
          blob,
        });
      }

      const duration = Date.now() - startTime;
      toast.success(`Successfully transferred ${selectedFiles.length} file(s)!`);

      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedReceiver('');
      }, 2000);
    } catch (error) {
      toast.error('Transfer failed. Please try again.');
      console.error('Transfer error:', error);
    }
  };

  const getStatusText = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'compressing':
        return 'Compressing...';
      case 'transferring':
        return 'Transferring...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
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
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>Drag and drop files or click to browse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Support for all file types</p>
                </div>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files ({selectedFiles.length})</p>
                <div className="space-y-2">
                  {selectedFiles.map((fileWithProgress) => (
                    <div
                      key={fileWithProgress.id}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{fileWithProgress.file.name}</p>
                          {fileWithProgress.status === 'complete' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : fileWithProgress.status !== 'pending' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeFile(fileWithProgress.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileWithProgress.file.size)}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {getStatusText(fileWithProgress.status)}
                          </p>
                        </div>
                        {fileWithProgress.status !== 'pending' && (
                          <Progress value={fileWithProgress.progress} className="h-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSendViaQR}
                disabled={!isAuthenticated || !isOnline || selectedFiles.length === 0 || selectedFiles.length > 1}
                variant="outline"
                className="flex-1"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Send via QR
              </Button>
              <Button 
                onClick={handleScanQR} 
                disabled={!isAuthenticated || !isOnline}
                variant="outline" 
                className="flex-1"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
            </div>

            {!isAuthenticated && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Login required for QR code features and online transfers.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Settings</CardTitle>
            <CardDescription>Choose a receiver and start the transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Receiver</label>
              <Select 
                value={selectedReceiver} 
                onValueChange={setSelectedReceiver}
                disabled={!isAuthenticated || !isOnline}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!isAuthenticated ? "Login required" : !isOnline ? "Offline" : "Choose an online user"} />
                </SelectTrigger>
                <SelectContent>
                  {availableReceivers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">No users online</div>
                  ) : (
                    availableReceivers.map((user) => (
                      <SelectItem key={user.toString()} value={user.toString()}>
                        {user.toString().slice(0, 10)}...{user.toString().slice(-8)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <img
                src="/assets/generated/transfer-progress.dim_600x400.png"
                alt="Transfer Progress"
                className="mb-3 w-full rounded-md"
              />
              <p className="text-sm text-muted-foreground">
                {isAuthenticated && isOnline
                  ? 'Files will be transferred directly to the selected user using peer-to-peer technology. No data is stored in the cloud.'
                  : 'Login and connect to the internet to use online transfer features.'}
              </p>
            </div>

            <Button
              onClick={handleTransfer}
              disabled={!isAuthenticated || !isOnline || !selectedReceiver || selectedFiles.length === 0 || uploadFile.isPending}
              className="w-full"
              size="lg"
            >
              {uploadFile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                `Transfer ${selectedFiles.length} File(s)`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      {isAuthenticated && isOnline && (
        <>
          <QRCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} file={fileForQR} />
          <QRScannerModal
            open={qrScannerOpen}
            onOpenChange={setQrScannerOpen}
            onFileScanned={handleFileScanned}
          />
        </>
      )}
    </>
  );
}
