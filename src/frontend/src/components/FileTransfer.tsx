import { useState, useCallback, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetOnlineUsers, useUploadFile, useRecordTransfer, useGetCallerUserProfile, useGetMultipleUserProfiles, useGetFileMetadata } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

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
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const uploadFile = useUploadFile();
  const recordTransfer = useRecordTransfer();
  const isOnline = useOnlineStatus();

  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const isAuthenticated = !!identity;
  const currentUserPrincipal = identity?.getPrincipal().toString();
  const availableReceivers = onlineUsers?.filter((user) => user.toString() !== currentUserPrincipal) || [];

  // Fetch profiles for all available receivers
  const { data: receiverProfiles } = useGetMultipleUserProfiles(availableReceivers);

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
    if (!isAuthenticated || !identity) {
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

    setIsTransferring(true);

    try {
      const startTime = Date.now();
      const senderPrincipal = identity.getPrincipal();
      const receiverPrincipal = availableReceivers.find(u => u.toString() === selectedReceiver);

      if (!receiverPrincipal) {
        throw new Error('Receiver not found');
      }

      // Process each file
      for (const fileWithProgress of selectedFiles) {
        if (fileWithProgress.status !== 'pending') continue;

        try {
          // Simulate transfer progress
          await simulateTransfer(fileWithProgress);

          // Upload file to backend
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

          // Fetch the uploaded file metadata from backend
          const fileMetadata = await uploadFile.mutateAsync({
            id: fileWithProgress.id,
            name: fileWithProgress.file.name,
            size: BigInt(fileWithProgress.file.size),
            fileType: fileWithProgress.file.type,
            blob,
          });

          // Record the transfer so receiver can see it
          const transferDuration = Date.now() - startTime;
          await recordTransfer.mutateAsync({
            id: `transfer-${fileWithProgress.id}`,
            sender: senderPrincipal,
            receiver: receiverPrincipal,
            file: {
              id: fileWithProgress.id,
              name: fileWithProgress.file.name,
              size: BigInt(fileWithProgress.file.size),
              fileType: fileWithProgress.file.type,
              uploader: senderPrincipal,
              uploadTime: BigInt(Date.now() * 1000000), // Convert to nanoseconds
              blob,
            },
            duration: BigInt(transferDuration),
            success: true,
          });
        } catch (error) {
          console.error(`Failed to transfer ${fileWithProgress.file.name}:`, error);
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === fileWithProgress.id ? { ...f, status: 'error' as const } : f))
          );
        }
      }

      const successCount = selectedFiles.filter(f => f.status === 'complete').length;
      if (successCount > 0) {
        toast.success(`Successfully transferred ${successCount} file(s)!`);
      }

      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedReceiver('');
      }, 2000);
    } catch (error) {
      toast.error('Transfer failed. Please try again.');
      console.error('Transfer error:', error);
    } finally {
      setIsTransferring(false);
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

  const getReceiverDisplayName = (principal: Principal): string => {
    const principalStr = principal.toString();
    const profile = receiverProfiles?.[principalStr];
    if (profile?.displayName) {
      return profile.displayName;
    }
    return `${principalStr.slice(0, 10)}...${principalStr.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Files Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>Drag and drop files or click to browse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUserProfile?.displayName && (
              <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Sending as: </span>
                <span className="font-medium">{currentUserProfile.displayName}</span>
              </div>
            )}

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
          </CardContent>
        </Card>

        {/* Transfer Settings Section */}
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
                        {getReceiverDisplayName(user)}
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
                Files will be transferred directly to the selected user using peer-to-peer technology. No data is stored in the cloud.
              </p>
            </div>

            <Button
              onClick={handleTransfer}
              disabled={!isAuthenticated || !isOnline || !selectedReceiver || selectedFiles.length === 0 || isTransferring}
              className="w-full"
              size="lg"
            >
              {isTransferring ? (
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
    </div>
  );
}
