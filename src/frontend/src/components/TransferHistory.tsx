import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTransferHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileIcon, ArrowRight, CheckCircle2, XCircle, Clock, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { toast } from 'sonner';
import { useState } from 'react';

export default function TransferHistory() {
  const { identity } = useInternetIdentity();
  const { data: transferHistory, isLoading } = useGetTransferHistory(identity?.getPrincipal() || null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: bigint) => {
    const num = Number(bytes);
    if (num === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: bigint) => {
    const seconds = Number(ms) / 1000;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleDownloadFile = async (recordId: string, fileName: string, fileType: string, blob: any) => {
    setDownloadingFiles(prev => new Set(prev).add(recordId));
    
    try {
      await downloadTransferFile(blob, fileName, fileType);
      toast.success(`${fileName} saved to your device`);
    } catch (error: any) {
      if (error.message === 'Save cancelled') {
        toast.info('Download cancelled');
      } else {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Loading your transfer history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transferHistory || transferHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Your file transfer history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No transfers yet</p>
            <p className="text-sm text-muted-foreground">Start sharing files to see your history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentUserPrincipal = identity?.getPrincipal().toString();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>View all your sent and received files</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {transferHistory.map((record) => {
              const isSender = record.sender.toString() === currentUserPrincipal;
              const otherParty = isSender ? record.receiver : record.sender;
              const isDownloading = downloadingFiles.has(record.id);

              return (
                <div key={record.id} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium truncate">{record.file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{formatFileSize(record.file.size)}</span>
                          <span>•</span>
                          <span className="truncate">{record.file.fileType || 'Unknown type'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <Badge variant={isSender ? 'default' : 'secondary'} className="text-xs">
                            {isSender ? 'Sent' : 'Received'}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {otherParty.toString().slice(0, 8)}...{otherParty.toString().slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {record.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <p>{format(new Date(Number(record.transferTime) / 1000000), 'MMM d, yyyy')}</p>
                        <p>{format(new Date(Number(record.transferTime) / 1000000), 'h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Duration: {formatDuration(record.transferDuration)}</span>
                      <span>•</span>
                      <span>Status: {record.success ? 'Completed' : 'Failed'}</span>
                    </div>
                    {!isSender && record.success && record.file.blob && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFile(
                          record.id,
                          record.file.name,
                          record.file.fileType,
                          record.file.blob
                        )}
                        disabled={isDownloading}
                        className="flex-shrink-0"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
