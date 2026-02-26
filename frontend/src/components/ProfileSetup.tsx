import React, { useState, useRef } from 'react';
import { User } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useKeyboardHandler } from '../hooks/useKeyboardHandler';
import { BRANDING } from '../constants/branding';

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useKeyboardHandler({ inputRefs: [nameInputRef] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    saveProfile(
      {
        displayName: displayName.trim(),
        avatarUrl: '',
        online: true,
      },
      { onSuccess: onComplete }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={36} className="text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Set Up Profile</h1>
            <p className="text-base text-muted-foreground mt-1">
              Choose a display name for {BRANDING.appName}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-foreground" htmlFor="name">
              Display Name
            </label>
            <input
              id="name"
              ref={nameInputRef}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="
                w-full min-h-[52px] px-4 rounded-xl
                bg-muted border border-border
                text-base text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring
              "
              autoComplete="name"
              inputMode="text"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !displayName.trim()}
            className="
              w-full min-h-[52px] rounded-xl
              bg-primary text-primary-foreground
              text-base font-semibold
              flex items-center justify-center gap-2
              disabled:opacity-50 transition-opacity
              active:scale-[0.98]
            "
          >
            {isPending ? (
              <>
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
