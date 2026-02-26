import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReceivedDownloadsList from './ReceivedDownloadsList';
import SentDownloadsList from './SentDownloadsList';
import { useNavigate } from '@tanstack/react-router';

interface TransferHistoryProps {
  initialSubTab?: string;
}

export default function TransferHistory({ initialSubTab }: TransferHistoryProps) {
  const [activeTab, setActiveTab] = useState(initialSubTab === 'received' ? 'received' : 'sent');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Scan button */}
      <div className="px-4 pt-4 pb-2">
        <Button
          onClick={() => navigate({ to: '/receive' })}
          className="w-full h-12 text-base rounded-2xl gap-2"
          variant="outline"
        >
          <QrCode className="w-5 h-5" />
          Scan QR to Receive File
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pb-2">
          <TabsList className="w-full h-10 rounded-xl">
            <TabsTrigger value="received" className="flex-1 rounded-lg text-sm">
              Received
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 rounded-lg text-sm">
              Sent
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="received" className="flex-1 mt-0 overflow-hidden">
          <ReceivedDownloadsList />
        </TabsContent>

        <TabsContent value="sent" className="flex-1 mt-0 overflow-hidden">
          <SentDownloadsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
