import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTransferHistory } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Send, QrCode } from 'lucide-react';
import ReceivedDownloadsList from './ReceivedDownloadsList';
import SentDownloadsList from './SentDownloadsList';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';
import QRScannerModal from './QRScannerModal';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { toast } from 'sonner';

export default function TransferHistory() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { triggerLight } = useHapticFeedback();
  const userPrincipal = identity?.getPrincipal() || null;
  const { data: transferHistory, isLoading } = useGetTransferHistory(userPrincipal);

  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const receivedFiles = transferHistory?.filter(
    (record) => record.receiver.toString() === userPrincipal?.toString() && record.success
  ) || [];

  const sentFiles = transferHistory?.filter(
    (record) => record.sender.toString() === userPrincipal?.toString() && record.success
  ) || [];

  const handleSendFiles = () => {
    triggerLight();
    navigate({ to: '/', search: { tab: 'transfer' } });
  };

  const handleReceiveFiles = () => {
    triggerLight();
    setQrScannerOpen(true);
  };

  const handleSessionScanned = (sessionId: string) => {
    // Show success message with the session ID
    toast.success('QR Code Scanned', {
      description: `Session ID: ${sessionId.slice(0, 8)}...`,
    });
    
    // Note: File receiving functionality would be implemented here
    // For now, we just acknowledge the scan
    console.log('Scanned session ID:', sessionId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transfer History</h2>
        <p className="text-sm text-muted-foreground">View your sent and received files</p>
      </div>

      <Tabs defaultValue="received" value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'sent')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="h-12">
            Received ({receivedFiles.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="h-12">
            Sent ({sentFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSendFiles}
              className="flex-1 h-12 gap-2"
              variant="default"
            >
              <Send className="h-5 w-5" />
              Send Files
            </Button>
            <Button
              onClick={handleReceiveFiles}
              className="flex-1 h-12 gap-2"
              variant="outline"
            >
              <QrCode className="h-5 w-5" />
              Receive Files
            </Button>
          </div>

          {/* Content */}
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
            <ReceivedDownloadsList receivedFiles={receivedFiles} maxHeight="calc(100vh - 380px)" />
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

      {/* QR Scanner Modal */}
      <QRScannerModal
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onSessionScanned={handleSessionScanned}
      />
    </div>
  );
}
