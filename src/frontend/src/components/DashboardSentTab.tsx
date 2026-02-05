import { useGetTransferHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { filterSentTransfers } from '../utils/receivedDownloads';
import SentDownloadsList from './SentDownloadsList';
import { Loader2 } from 'lucide-react';

export default function DashboardSentTab() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal();
  const { data: transferHistory = [], isLoading } = useGetTransferHistory(currentPrincipal || null);

  const sentFiles = filterSentTransfers(transferHistory, currentPrincipal);

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
        <h3 className="text-lg font-semibold">Sent Downloads</h3>
        <p className="text-sm text-muted-foreground">
          Files you've sent to others ({sentFiles.length})
        </p>
      </div>

      <SentDownloadsList sentFiles={sentFiles} />
    </div>
  );
}
