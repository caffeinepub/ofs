import { useGetTransferHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { filterReceivedTransfers } from '../utils/receivedDownloads';
import ReceivedDownloadsList from './ReceivedDownloadsList';
import { Loader2 } from 'lucide-react';

export default function SettingsDownloadsSection() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal();
  const { data: transferHistory = [], isLoading } = useGetTransferHistory(currentPrincipal || null);

  const receivedFiles = filterReceivedTransfers(transferHistory, currentPrincipal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Received Files ({receivedFiles.length})
        </h3>
        <p className="text-xs text-muted-foreground">
          Download files that were sent to you
        </p>
      </div>

      <ReceivedDownloadsList receivedFiles={receivedFiles} maxHeight="400px" />
    </div>
  );
}
