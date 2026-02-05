import { useState } from 'react';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { isInstallablePackage, formatFileSize, formatTimestamp } from '../utils/receivedDownloads';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, FileIcon, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { TransferRecordData } from '../backend';

interface ReceivedDownloadsListProps {
  receivedFiles: TransferRecordData[];
  maxHeight?: string;
}

export default function ReceivedDownloadsList({ receivedFiles, maxHeight = '400px' }: ReceivedDownloadsListProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (record: TransferRecordData) => {
    const { id, file } = record;
    const isInstallable = isInstallablePackage(file.name);

    setDownloadingIds(prev => new Set(prev).add(id));

    try {
      await downloadTransferFile(file.blob, file.name, file.fileType);
      
      if (isInstallable) {
        toast.success(`${file.name} downloaded`, {
          description: 'To install, open the file from your device\'s Downloads or Files app.',
          duration: 6000,
        });
      } else {
        toast.success(`${file.name} saved to your device`);
      }
    } catch (error: any) {
      if (error.message === 'Save cancelled') {
        toast.info('Download cancelled');
      } else {
        toast.error('Failed to download file', {
          description: error.message || 'Please try again.',
        });
      }
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (receivedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Download className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Files you receive from other users will appear here for easy access.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={`pr-4`} style={{ height: maxHeight }}>
      <div className="space-y-3">
        {receivedFiles.map((record, index) => {
          const { id, file, transferTime } = record;
          const isDownloading = downloadingIds.has(id);
          const isInstallable = isInstallablePackage(file.name);

          return (
            <div key={id}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2 mt-1">
                  {isInstallable ? (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.fileType || 'Unknown type'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Received {formatTimestamp(transferTime)}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={isInstallable ? 'default' : 'outline'}
                      onClick={() => handleDownload(record)}
                      disabled={isDownloading}
                      className="shrink-0"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          {isInstallable ? 'Download to install' : 'Download'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
