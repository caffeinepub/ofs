import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTransferHistory } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceivedDownloadsList from './ReceivedDownloadsList';
import SentDownloadsList from './SentDownloadsList';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';

export default function TransferHistory() {
  const { identity } = useInternetIdentity();
  const userPrincipal = identity?.getPrincipal() || null;
  const { data: transferHistory, isLoading } = useGetTransferHistory(userPrincipal);

  const receivedFiles = transferHistory?.filter(
    (record) => record.receiver.toString() === userPrincipal?.toString() && record.success
  ) || [];

  const sentFiles = transferHistory?.filter(
    (record) => record.sender.toString() === userPrincipal?.toString() && record.success
  ) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transfer History</h2>
        <p className="text-sm text-muted-foreground">View your sent and received files</p>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="h-12">
            Received ({receivedFiles.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="h-12">
            Sent ({sentFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
            </div>
          ) : receivedFiles.length === 0 ? (
            <EmptyState
              imagePath="/assets/generated/empty-history.dim_300x200.png"
              title="No received files"
              description="Files you receive from other users will appear here for easy access."
            />
          ) : (
            <ReceivedDownloadsList receivedFiles={receivedFiles} maxHeight="calc(100vh - 320px)" />
          )}
        </TabsContent>

        <TabsContent value="sent">
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
              <SkeletonCard height="100px" />
            </div>
          ) : sentFiles.length === 0 ? (
            <EmptyState
              imagePath="/assets/generated/empty-history.dim_300x200.png"
              title="No sent files"
              description="Files you send to other users will appear here for reference."
            />
          ) : (
            <SentDownloadsList sentFiles={sentFiles} maxHeight="calc(100vh - 320px)" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
