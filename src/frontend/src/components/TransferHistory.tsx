import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import React, { useState } from "react";
import ReceivedDownloadsList from "./ReceivedDownloadsList";
import SentDownloadsList from "./SentDownloadsList";

interface TransferHistoryProps {
  initialSubTab?: string;
}

export default function TransferHistory({
  initialSubTab,
}: TransferHistoryProps) {
  const [activeTab, setActiveTab] = useState(
    initialSubTab === "received" ? "received" : "sent",
  );
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Scan button */}
      <div className="pb-2">
        <Button
          onClick={() => navigate({ to: "/receive" })}
          className="w-full h-12 text-base rounded-2xl gap-2"
          variant="outline"
          data-ocid="history.scan.button"
        >
          <QrCode className="w-5 h-5" />
          Scan QR to Receive File
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="pb-2">
          <TabsList className="w-full h-10 rounded-xl">
            <TabsTrigger
              value="received"
              className="flex-1 rounded-lg text-sm"
              data-ocid="history.received.tab"
            >
              Received
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="flex-1 rounded-lg text-sm"
              data-ocid="history.sent.tab"
            >
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
