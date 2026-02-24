import { useState } from 'react';
import type { TransferRecordData } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText, User } from 'lucide-react';
import { formatFileSize, formatTimestamp } from '../utils/receivedDownloads';
import { downloadTransferFile } from '../utils/downloadTransferFile';
import { toast } from 'sonner';
import { useLongPress } from '../hooks/useLongPress';
import FileContextMenu from './FileContextMenu';

interface SentDownloadsListProps {
  sentFiles: TransferRecordData[];
  maxHeight?: string;
}

export default function SentDownloadsList({ sentFiles, maxHeight = '500px' }: SentDownloadsListProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [contextMenuFile, setContextMenuFile] = useState<TransferRecordData | null>(null);

  const handleDownload = async (record: TransferRecordData) => {
    setDownloadingIds((prev) => new Set(prev).add(record.id));
    try {
      await downloadTransferFile(record.file.blob, record.file.name, record.file.fileType);
      toast.success(`Downloaded ${record.file.name}`);
    } catch (error: any) {
      if (error.message === 'Save cancelled') {
        toast.info('Download cancelled');
      } else {
        toast.error(`Failed to download: ${error.message}`);
      }
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  const longPressHandlers = useLongPress({
    onLongPress: (record: TransferRecordData) => {
      setContextMenuFile(record);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    },
    delay: 500,
  });

  if (sentFiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No sent files yet. Share files with others to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 touch-pan-y" style={{ maxHeight, overflowY: 'auto' }}>
        {sentFiles.map((record) => {
          const isDownloading = downloadingIds.has(record.id);
          const receiverName = record.receiver.toString().slice(0, 8) + '...';

          return (
            <Card
              key={record.id}
              className="hover:shadow-md transition-shadow active:bg-muted/50"
              {...longPressHandlers(record)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{record.file.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3" />
                      Sent to {receiverName}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(record)}
                    disabled={isDownloading}
                    className="shrink-0 h-11 min-w-[44px]"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatFileSize(record.file.size)}</span>
                  <span>•</span>
                  <span>{formatTimestamp(record.transferTime)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FileContextMenu
        open={!!contextMenuFile}
        onOpenChange={(open) => !open && setContextMenuFile(null)}
        file={contextMenuFile}
        onDownload={() => {
          if (contextMenuFile) {
            handleDownload(contextMenuFile);
            setContextMenuFile(null);
          }
        }}
      />
    </>
  );
}
