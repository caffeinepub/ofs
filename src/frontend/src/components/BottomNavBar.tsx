import { Send, History, Users, Sparkles } from 'lucide-react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

type TabValue = 'transfer' | 'history' | 'users' | 'ai';

interface BottomNavBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const { triggerLight } = useHapticFeedback();

  const tabs = [
    { value: 'transfer' as TabValue, label: 'Transfer', icon: Send },
    { value: 'history' as TabValue, label: 'History', icon: History },
    { value: 'users' as TabValue, label: 'Users', icon: Users },
    { value: 'ai' as TabValue, label: 'AI', icon: Sparkles },
  ];

  const handleTabClick = (tab: TabValue) => {
    triggerLight();
    onTabChange(tab);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ value, label, icon: Icon }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              onClick={() => handleTabClick(value)}
              className={`flex min-w-[60px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
