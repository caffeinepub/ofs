import { useState } from "react";
import AIFeatures from "../components/AIFeatures";
import BottomNavBar from "../components/BottomNavBar";
import FileTransfer from "../components/FileTransfer";
import OnlineUsers from "../components/OnlineUsers";
import TransferHistory from "../components/TransferHistory";
import { TransferProvider } from "../contexts/TransferContext";

type TabValue = "transfer" | "history" | "users" | "ai";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("transfer");
  const [historySubTab, setHistorySubTab] = useState<"sent" | "received">(
    "sent",
  );

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  const handleNavigateToReceived = () => {
    setHistorySubTab("received");
    setActiveTab("history");
  };

  return (
    <TransferProvider>
      <div className="relative min-h-full">
        <div className="px-4 py-6 pb-24">
          {activeTab === "transfer" && (
            <FileTransfer onNavigateToReceived={handleNavigateToReceived} />
          )}
          {activeTab === "history" && (
            <TransferHistory initialSubTab={historySubTab} />
          )}
          {activeTab === "users" && <OnlineUsers />}
          {activeTab === "ai" && (
            <AIFeatures
              onNavigateToTransfer={() => handleTabChange("transfer")}
            />
          )}
        </div>

        <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </TransferProvider>
  );
}
