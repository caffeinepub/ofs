import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useUpdateProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  // Initialize form with current profile data
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast.error('Display name cannot be empty');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName: trimmedName,
        avatarUrl: avatarUrl.trim(),
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile data
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      setBio('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={updateProfile.isPending}
              autoComplete="name"
            />
            <p className="text-xs text-muted-foreground">
              This is how other users will see you
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={updateProfile.isPending}
              autoComplete="photo"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter a URL to your profile picture
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              placeholder="Tell others about yourself (coming soon)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Additional profile fields coming soon
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
