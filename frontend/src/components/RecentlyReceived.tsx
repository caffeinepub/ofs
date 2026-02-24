import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTransferHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon, Download, Loader2, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { toast } from 'sonner';
import { useState } from 'react';

export default function RecentlyReceived() {
  const { identity } = useInternetIdentity();
  const { data: transferHistory, isLoading } = useGetTransferHistory(identity?.getPrincipal() || null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Filter for received files only (successful transfers where current user is receiver)
  const receivedFiles = transferHistory?.filter(
    (record) => record.receiver.toString() === currentUserPrincipal && record.success
  ) || [];

  // Get most recent 5 received files
  const recentFiles = receivedFiles.slice(0, 5);

  const formatFileSize = (bytes: bigint) => {
    const num = Number(bytes);
    if (num === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (recordId: string, fileName: string, fileType: string, blob: any) => {
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
          <CardTitle>Recently Received</CardTitle>
          <CardDescription>Loading recent files...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Received</CardTitle>
          <CardDescription>Files you've received will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No received files yet</p>
            <p className="text-sm text-muted-foreground">Files sent to you will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Received</CardTitle>
        <CardDescription>Your most recent received files</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentFiles.map((record) => {
            const isDownloading = downloadingFiles.has(record.id);

            return (
              <div key={record.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
                <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                  <FileIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium truncate">{record.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(record.file.size)}</span>
                    <span>•</span>
                    <span>{format(new Date(Number(record.transferTime) / 1000000), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                {record.file.blob && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
