import { useState, useEffect } from 'react';
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
            You are offline. Online features (user list, transfer history, QR sharing) are unavailable. Please check your internet connection.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
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
