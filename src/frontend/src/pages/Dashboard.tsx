import { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetOnlineUsers, useSetOnlineStatus, useGetTransferHistory } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import FileTransfer from '../components/FileTransfer';
import TransferHistory from '../components/TransferHistory';
import OnlineUsers from '../components/OnlineUsers';
import AIFeatures from '../components/AIFeatures';
import RecentlyReceived from '../components/RecentlyReceived';
import DashboardDownloadsTab from '../components/DashboardDownloadsTab';
import DashboardSentTab from '../components/DashboardSentTab';
import { toast } from 'sonner';

interface PrefilledFile {
  file: File;
  source: 'compression' | 'other';
}

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const setOnlineStatus = useSetOnlineStatus();
  const { data: onlineUsers } = useGetOnlineUsers();
  const { data: transferHistory } = useGetTransferHistory(identity?.getPrincipal() || null);
  const isOnline = useOnlineStatus();
  
  const [activeTab, setActiveTab] = useState('transfer');
  const [prefilledFile, setPrefilledFile] = useState<PrefilledFile | null>(null);
  
  // Track seen transfer IDs to detect new received files
  const seenTransferIds = useRef<Set<string>>(new Set());
  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Set user online when component mounts and browser is online
  useEffect(() => {
    if (isOnline && identity) {
      setOnlineStatus.mutate(true);
    }

    // Set user offline when component unmounts or page closes
    return () => {
      if (identity) {
        setOnlineStatus.mutate(false);
      }
    };
  }, [isOnline, identity]);

  // Detect newly received transfers and show notifications
  useEffect(() => {
    if (!transferHistory || !currentUserPrincipal) return;

    // Filter for received files (where current user is receiver)
    const receivedTransfers = transferHistory.filter(
      (record) => record.receiver.toString() === currentUserPrincipal && record.success
    );

    // Check for new transfers not previously seen
    receivedTransfers.forEach((record) => {
      if (!seenTransferIds.current.has(record.id)) {
        // Mark as seen
        seenTransferIds.current.add(record.id);
        
        // Only show toast if this is not the initial load (i.e., we already have some seen IDs)
        if (seenTransferIds.current.size > 1) {
          toast.success(`New file received: ${record.file.name}`, {
            description: 'Check Recently Received to download',
            duration: 5000,
          });
        }
      }
    });
  }, [transferHistory, currentUserPrincipal]);

  const handleShareCompressedImage = (file: File) => {
    setPrefilledFile({ file, source: 'compression' });
    setActiveTab('transfer');
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">File Sharing Dashboard</h2>
        <p className="text-muted-foreground">Transfer files securely with peer-to-peer technology</p>
      </div>

      {!isOnline && (
        <Alert variant="destructive" className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are offline. Online features (user list, transfer history) are unavailable. Please check your internet connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Recently Received Widget */}
      {isOnline && (
        <div className="mb-6">
          <RecentlyReceived />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="downloads" disabled={!isOnline}>
            Downloads
          </TabsTrigger>
          <TabsTrigger value="sent" disabled={!isOnline}>
            Sent
          </TabsTrigger>
          <TabsTrigger value="history" disabled={!isOnline}>
            History
            {transferHistory && transferHistory.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {transferHistory.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" disabled={!isOnline}>
            Users
            {onlineUsers && onlineUsers.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {onlineUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai" disabled={!isOnline}>AI Features</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="space-y-6">
          <FileTransfer prefilledFile={prefilledFile} onFileProcessed={() => setPrefilledFile(null)} />
        </TabsContent>

        <TabsContent value="downloads">
          {isOnline ? (
            <DashboardDownloadsTab />
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>This feature requires an internet connection.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {isOnline ? (
            <DashboardSentTab />
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>This feature requires an internet connection.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="history">
          {isOnline ? (
            <TransferHistory />
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>This feature requires an internet connection.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="users">
          {isOnline ? (
            <OnlineUsers />
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>This feature requires an internet connection.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="ai">
          {isOnline ? (
            <AIFeatures onShareCompressedImage={handleShareCompressedImage} />
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>This feature requires an internet connection.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
