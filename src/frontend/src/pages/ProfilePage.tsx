import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUpdateProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useOrientationLock } from '../hooks/useOrientationLock';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateProfile();
  const { isLocked, isSupported, toggleLock } = useOrientationLock();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const displayNameRef = useRef<HTMLInputElement>(null);
  const avatarUrlRef = useRef<HTMLInputElement>(null);

  useKeyboardHandler({
    inputRefs: [displayNameRef, avatarUrlRef],
  });

  // Update form when profile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleBack = () => {
    navigate({ to: '/menu' });
  };

  const swipeHandlers = useSwipeBack({
    onSwipeBack: handleBack,
    threshold: 100,
  });

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      toast.success('Profile updated successfully');
      navigate({ to: '/menu' });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    }
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
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto safe-bottom">
        <div className="px-4 py-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base">
                Display Name
              </Label>
              <Input
                ref={displayNameRef}
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-base">
                Avatar URL (optional)
              </Label>
              <Input
                ref={avatarUrlRef}
                id="avatarUrl"
                type="url"
                inputMode="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Principal ID</Label>
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs font-mono break-all">
                  {identity?.getPrincipal().toString()}
                </p>
              </div>
            </div>
          </div>

          {isSupported && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="orientation-lock" className="text-base">
                      Lock Portrait Orientation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent screen rotation on mobile devices
                    </p>
                  </div>
                  <Switch
                    id="orientation-lock"
                    checked={isLocked}
                    onCheckedChange={toggleLock}
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="w-full h-14 text-base"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
