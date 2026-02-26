import React from 'react';
import { Send, History, Users, Sparkles } from 'lucide-react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

type TabValue = 'transfer' | 'history' | 'users' | 'ai';

interface BottomNavBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabs: { id: TabValue; label: string; icon: React.ElementType }[] = [
  { id: 'transfer', label: 'Transfer', icon: Send },
  { id: 'history', label: 'History', icon: History },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const { triggerLight } = useHapticFeedback();

  const handleTabClick = (tabId: TabValue) => {
    triggerLight();
    onTabChange(tabId);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                min-h-[56px] py-2 px-1
                transition-colors duration-150
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={26}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="shrink-0"
              />
              <span
                className={`text-[13px] leading-tight tracking-tight ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
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
