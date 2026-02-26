import React from 'react';
import { Settings, LogOut, Smartphone } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { BRANDING } from '../constants/branding';

interface MobileMenuProps {
  onNavigateToProfile: () => void;
  onClose: () => void;
}

export default function MobileMenu({ onNavigateToProfile, onClose }: MobileMenuProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { isInstallable, promptInstall } = useInstallPrompt();

  const displayName = userProfile?.displayName || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onClose();
  };

  const handleProfileSettings = () => {
    onNavigateToProfile();
    onClose();
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{initials}</span>
          </div>
          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{BRANDING.appName} User</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-1 px-4 py-4 flex-1">
        <button
          onClick={handleProfileSettings}
          className="
            flex items-center gap-4 w-full
            min-h-[56px] px-4 rounded-xl
            text-base font-medium text-foreground
            hover:bg-muted active:bg-muted/80
            transition-colors text-left
          "
        >
          <Settings size={22} className="text-muted-foreground shrink-0" />
          <span>Profile Settings</span>
        </button>

        {isInstallable && (
          <button
            onClick={handleInstall}
            className="
              flex items-center gap-4 w-full
              min-h-[56px] px-4 rounded-xl
              text-base font-medium text-foreground
              hover:bg-muted active:bg-muted/80
              transition-colors text-left
            "
          >
            <Smartphone size={22} className="text-muted-foreground shrink-0" />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="px-4 pb-8 border-t border-border pt-4">
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-4 w-full
            min-h-[56px] px-4 rounded-xl
            text-base font-semibold text-destructive
            hover:bg-destructive/10 active:bg-destructive/20
            transition-colors text-left
          "
        >
          <LogOut size={22} className="shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
