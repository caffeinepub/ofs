import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, LogOut, Settings, Download } from 'lucide-react';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function MobileMenu() {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { isInstallable, promptInstall } = useInstallPrompt();

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const swipeHandlers = useSwipeBack({
    onSwipeBack: handleBack,
    threshold: 100,
  });

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleProfileClick = () => {
    navigate({ to: '/profile' });
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-background animate-in slide-in-from-right duration-300"
      {...swipeHandlers}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur px-4 safe-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-11 w-11"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-semibold">Menu</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto safe-bottom">
        <div className="px-4 py-6 space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {userProfile?.displayName ? getInitials(userProfile.displayName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold truncate">{userProfile?.displayName || 'User'}</p>
            </div>
          </div>

          <Separator />

          {/* Profile Settings */}
          <Button
            variant="ghost"
            className="w-full justify-start h-14 text-base"
            onClick={handleProfileClick}
          >
            <Settings className="mr-3 h-5 w-5" />
            <span>Profile</span>
          </Button>

          {/* Install App Button */}
          {isInstallable && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start h-14 text-base"
                onClick={handleInstall}
              >
                <Download className="mr-3 h-5 w-5" />
                <span>Install App</span>
              </Button>
            </>
          )}

          <Separator />

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start h-14 text-base text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
