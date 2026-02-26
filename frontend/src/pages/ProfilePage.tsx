import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';
import { useOrientationLock } from '../hooks/useOrientationLock';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending: isSaving } = useSaveCallerUserProfile();

  const [displayName, setDisplayName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { isLocked, toggleLock } = useOrientationLock();

  useSwipeBack({ onSwipeBack: onBack });
  useKeyboardHandler({ inputRefs: [nameInputRef] });

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  const handleSave = () => {
    if (!displayName.trim()) return;
    saveProfile(
      {
        displayName: displayName.trim(),
        avatarUrl: userProfile?.avatarUrl || '',
        online: userProfile?.online ?? true,
      },
      { onSuccess: onBack }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-4 p-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">Profile Settings</h1>
        <button
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          className="
            flex items-center gap-2 px-4 min-h-[40px] rounded-xl
            bg-primary text-primary-foreground
            text-base font-semibold
            disabled:opacity-50 transition-opacity
            active:scale-[0.98]
          "
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>Save</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5 p-4 overflow-y-auto">
        {/* Display Name */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-foreground" htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            ref={nameInputRef}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="
              w-full min-h-[52px] px-4 rounded-xl
              bg-muted border border-border
              text-base text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring
            "
            autoComplete="name"
            inputMode="text"
          />
        </div>

        {/* Orientation Lock */}
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-base font-semibold text-foreground">Portrait Lock</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Keep screen in portrait orientation
            </p>
          </div>
          <button
            onClick={toggleLock}
            className={`
              relative w-14 h-8 rounded-full transition-colors shrink-0
              ${isLocked ? 'bg-primary' : 'bg-muted'}
            `}
            role="switch"
            aria-checked={isLocked}
          >
            <span
              className={`
                absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform
                ${isLocked ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Save button (bottom) */}
        <button
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          className="
            w-full min-h-[52px] rounded-xl
            bg-primary text-primary-foreground
            text-base font-semibold
            flex items-center justify-center gap-2
            disabled:opacity-50 transition-opacity
            active:scale-[0.98]
          "
        >
          {isSaving ? (
            <>
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
