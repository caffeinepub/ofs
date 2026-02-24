import { useState, useRef } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BRANDING } from '../constants/branding';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  
  const displayNameRef = useRef<HTMLInputElement>(null);
  const avatarUrlRef = useRef<HTMLInputElement>(null);

  useKeyboardHandler({
    inputRefs: [displayNameRef, avatarUrlRef],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
        online: true,
      });
      toast.success('Profile created successfully!');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to create profile');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img
              src="/assets/generated/ofs-logo-transparent.dim_200x200.png"
              alt="OFS Logo"
              className="h-20 w-20 mx-auto"
            />
          </div>
          <CardTitle className="text-2xl">Welcome to {BRANDING.appName}</CardTitle>
          <CardDescription>Let's set up your profile to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base">
                Display Name *
              </Label>
              <Input
                ref={displayNameRef}
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
                className="h-14 text-base"
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
                className="h-14 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={saveProfile.isPending}
              className="w-full h-14 text-base"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
