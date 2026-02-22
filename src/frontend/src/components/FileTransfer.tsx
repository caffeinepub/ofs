import { useState, useCallback, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetOnlineUsers, useUploadFile, useRecordTransfer, useGetCallerUserProfile, useGetMultipleUserProfiles } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import NetworkWarningDialog from './NetworkWarningDialog';
import { validateFileSize } from '../utils/fileSizeValidation';
import EmptyState from './EmptyState';

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
  const { triggerMedium, triggerSuccess } = useHapticFeedback();
  const networkInfo = useNetworkInfo();

  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(false);

  const isAuthenticated = !!identity;
  const currentUserPrincipal = identity?.getPrincipal().toString();
  const availableReceivers = onlineUsers?.filter((user) => user.toString() !== currentUserPrincipal) || [];

  // Fetch profiles for all available receivers
  const { data: receiverProfilesMap } = useGetMultipleUserProfiles(availableReceivers);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate file sizes
      for (const file of files) {
        const validation = validateFileSize(file.size);
        
        if (validation.type === 'error') {
          toast.error('File too large', {
            description: validation.message,
          });
          e.target.value = '';
          return;
        }
        
        if (validation.type === 'warning') {
          toast.warning('Large file detected', {
            description: validation.message,
          });
        }
      }
      
      addFiles(files);
      triggerMedium();
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

  const checkNetworkAndProceed = () => {
    if (selectedFiles.length === 0) return;

    const largestFile = selectedFiles.reduce((max, f) => 
      f.file.size > max.file.size ? f : max
    );

    const shouldWarn = 
      networkInfo.isSupported &&
      largestFile.file.size > 5 * 1024 * 1024 && // 5MB
      (networkInfo.isSlow || networkInfo.isMetered);

    if (shouldWarn) {
      setShowNetworkWarning(true);
      setPendingTransfer(true);
    } else {
      performTransfer();
    }
  };

  const handleNetworkWarningProceed = () => {
    setShowNetworkWarning(false);
    setPendingTransfer(false);
    performTransfer();
  };

  const handleNetworkWarningCancel = () => {
    setShowNetworkWarning(false);
    setPendingTransfer(false);
  };

  const performTransfer = async () => {
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
              uploadTime: BigInt(Date.now()) * BigInt(1000000),
              blob,
            },
            duration: BigInt(transferDuration),
            success: true,
          });

          triggerSuccess();
        } catch (error: any) {
          console.error('Transfer error:', error);
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === fileWithProgress.id ? { ...f, status: 'error' as const } : f))
          );
          toast.error(`Failed to transfer ${fileWithProgress.file.name}`);
        }
      }

      const successCount = selectedFiles.filter(f => f.status === 'complete').length;
      if (successCount > 0) {
        toast.success(`Successfully transferred ${successCount} file(s)`);
        setSelectedFiles([]);
        setSelectedReceiver('');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error('Transfer failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransfer = () => {
    checkNetworkAndProceed();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasNoActivity = selectedFiles.length === 0 && !isTransferring;

  if (hasNoActivity) {
    return (
      <>
        <EmptyState
          imagePath="/assets/generated/empty-transfer.dim_300x200.png"
          title="No files selected"
          description="Select a file to start transferring to other users"
          actionLabel="Select File"
          onAction={() => document.getElementById('file-input')?.click()}
        />
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">File Transfer</h2>
          <p className="text-sm text-muted-foreground">Send files to online users</p>
        </div>

        <Card className="z-[40]">
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>Choose files to transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <input
                id="file-input-main"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-input-main')?.click()}
                disabled={isTransferring}
                className="w-full h-14 text-base"
              >
                <Upload className="mr-2 h-5 w-5" />
                Select Files
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3 mt-4">
                {selectedFiles.map((fileWithProgress) => (
                  <div key={fileWithProgress.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileWithProgress.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {fileWithProgress.status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : fileWithProgress.status === 'error' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(fileWithProgress.id)}
                          className="h-9 w-9 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(fileWithProgress.id)}
                          disabled={isTransferring}
                          className="h-9 w-9 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {fileWithProgress.status !== 'pending' && fileWithProgress.status !== 'error' && (
                      <div className="space-y-1">
                        <Progress value={fileWithProgress.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground capitalize">
                          {fileWithProgress.status}... {fileWithProgress.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Receiver</CardTitle>
            <CardDescription>Choose who to send the files to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedReceiver} onValueChange={setSelectedReceiver} disabled={isTransferring}>
              <SelectTrigger className="h-14 text-base">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableReceivers.map((principal) => {
                  const profile = receiverProfilesMap?.[principal.toString()];
                  return (
                    <SelectItem key={principal.toString()} value={principal.toString()}>
                      {profile?.displayName || principal.toString().slice(0, 12) + '...'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              onClick={handleTransfer}
              disabled={!selectedReceiver || selectedFiles.length === 0 || isTransferring}
              className="w-full h-14 text-base"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Transfer Files
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <NetworkWarningDialog
        isOpen={showNetworkWarning}
        onClose={handleNetworkWarningCancel}
        onProceed={handleNetworkWarningProceed}
        fileSize={selectedFiles[0]?.file.size || 0}
        connectionType={networkInfo.connectionType}
        isMetered={networkInfo.isMetered}
      />
    </>
  );
}
