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

  const handleNavigateToReceived = () => {
    setHistorySubTab("received");
    setActiveTab("history");
  };

  // Keep historySubTab in sync but suppress lint warning
  void handleNavigateToReceived;

  return (
    <TransferProvider>
      <div style={{ position: "relative", minHeight: "100%" }}>
        <div style={{ padding: "16px 16px 100px" }}>
          {activeTab === "transfer" && <FileTransfer />}
          {activeTab === "history" && (
            <TransferHistory initialSubTab={historySubTab} />
          )}
          {activeTab === "users" && <OnlineUsers />}
          {activeTab === "ai" && (
            <AIFeatures onNavigateToTransfer={() => setActiveTab("transfer")} />
          )}
        </div>
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </TransferProvider>
  );
}
