import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSetOnlineStatus } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import FileTransfer from '../components/FileTransfer';
import TransferHistory from '../components/TransferHistory';
import OnlineUsers from '../components/OnlineUsers';
import AIFeatures from '../components/AIFeatures';
import BottomNavBar from '../components/BottomNavBar';

type TabValue = 'transfer' | 'history' | 'users' | 'ai';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const setOnlineStatus = useSetOnlineStatus();
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<TabValue>('transfer');
  const [prefilledFile, setPrefilledFile] = useState<{ file: File; source: string } | null>(null);

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

  const handleFileProcessed = () => {
    setPrefilledFile(null);
  };

  return (
    <div className="relative min-h-full">
      <div className="px-4 py-6 pb-24">
        {activeTab === 'transfer' && (
          <FileTransfer prefilledFile={prefilledFile} onFileProcessed={handleFileProcessed} />
        )}
        {activeTab === 'history' && <TransferHistory />}
        {activeTab === 'users' && <OnlineUsers />}
        {activeTab === 'ai' && <AIFeatures onShareCompressedImage={handleShareCompressedImage} />}
      </div>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
