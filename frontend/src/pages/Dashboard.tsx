import { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSetOnlineStatus } from '../hooks/useQueries';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import FileTransfer from '../components/FileTransfer';
import TransferHistory from '../components/TransferHistory';
import OnlineUsers from '../components/OnlineUsers';
import AIFeatures from '../components/AIFeatures';
import BottomNavBar from '../components/BottomNavBar';

type TabValue = 'transfer' | 'history' | 'users' | 'ai';
type SubTabValue = 'received' | 'sent';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const setOnlineStatus = useSetOnlineStatus();
  const isOnline = useOnlineStatus();

  // Read tab and subtab from URL search params
  const search = useSearch({ strict: false }) as { tab?: TabValue; subtab?: SubTabValue };
  const initialTab =
    search.tab && ['transfer', 'history', 'users', 'ai'].includes(search.tab)
      ? search.tab
      : 'transfer';

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Update active tab when URL search params change
  useEffect(() => {
    if (search.tab && ['transfer', 'history', 'users', 'ai'].includes(search.tab)) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  // Set user online when component mounts and browser is online
  useEffect(() => {
    if (isOnline && identity) {
      setOnlineStatus.mutate(true);
    }

    return () => {
      if (identity) {
        setOnlineStatus.mutate(false);
      }
    };
  }, [isOnline, identity]);

  return (
    <div className="relative min-h-full">
      <div className="px-4 py-6 pb-24">
        {activeTab === 'transfer' && <FileTransfer />}
        {activeTab === 'history' && <TransferHistory initialSubTab={search.subtab} />}
        {activeTab === 'users' && <OnlineUsers />}
        {activeTab === 'ai' && <AIFeatures />}
      </div>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
