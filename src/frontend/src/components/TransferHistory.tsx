import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTransferHistory, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileIcon, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function TransferHistory() {
  const { identity } = useInternetIdentity();
  const { data: transferHistory, isLoading } = useGetTransferHistory(identity?.getPrincipal() || null);

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

              return (
                <div key={record.id} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{record.file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(record.file.size)}</span>
                          <span>•</span>
                          <span>{record.file.fileType || 'Unknown type'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant={isSender ? 'default' : 'secondary'} className="text-xs">
                            {isSender ? 'Sent' : 'Received'}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {otherParty.toString().slice(0, 8)}...{otherParty.toString().slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {record.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(Number(record.transferTime) / 1000000), 'MMM d, yyyy')}</p>
                        <p>{format(new Date(Number(record.transferTime) / 1000000), 'h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Duration: {formatDuration(record.transferDuration)}</span>
                    <span>•</span>
                    <span>Status: {record.success ? 'Completed' : 'Failed'}</span>
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
