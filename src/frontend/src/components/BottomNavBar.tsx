import { History, Send, Sparkles, Users } from "lucide-react";
import type React from "react";

type TabValue = "transfer" | "history" | "users" | "ai";

interface BottomNavBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabs: { id: TabValue; label: string; icon: React.ElementType }[] = [
  { id: "transfer", label: "Transfer", icon: Send },
  { id: "history", label: "History", icon: History },
  { id: "users", label: "Users", icon: Users },
  { id: "ai", label: "AI", icon: Sparkles },
];

export default function BottomNavBar({
  activeTab,
  onTabChange,
}: BottomNavBarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        zIndex: 40,
        backgroundColor: "var(--card)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div style={{ display: "flex" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-ocid={`nav.${tab.id}.tab`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                minHeight: "58px",
                padding: "8px 4px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                transition: "color 0.15s",
              }}
              aria-label={tab.label}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                  letterSpacing: "0.2px",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
