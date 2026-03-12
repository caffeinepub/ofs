import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useKeyboardHandler } from "../hooks/useKeyboardHandler";
import { useLocalProfile } from "../hooks/useLocalProfile";
import { useOrientationLock } from "../hooks/useOrientationLock";
import { useSwipeBack } from "../hooks/useSwipeBack";

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { profile, setProfile } = useLocalProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { isLocked, toggleLock } = useOrientationLock();

  useSwipeBack({ onSwipeBack: onBack });
  useKeyboardHandler({ inputRefs: [nameInputRef] });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
    }
  }, [profile]);

  const handleSave = () => {
    if (!displayName.trim()) return;
    setProfile(displayName.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Go back"
          data-ocid="profile.cancel_button"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">
          Profile Settings
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!displayName.trim()}
          data-ocid="profile.save_button"
          className="flex items-center gap-2 px-4 min-h-[40px] rounded-xl bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 transition-opacity active:scale-[0.98]"
        >
          <Save size={18} />
          <span>Save</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5 p-4 overflow-y-auto">
        {/* Display Name */}
        <div className="flex flex-col gap-2">
          <label
            className="text-base font-semibold text-foreground"
            htmlFor="displayName"
          >
            Display Name
          </label>
          <input
            id="displayName"
            ref={nameInputRef}
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (saveSuccess) setSaveSuccess(false);
            }}
            placeholder="Enter your display name"
            data-ocid="profile.input"
            className="w-full min-h-[52px] px-4 rounded-xl bg-muted border border-border text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="name"
            inputMode="text"
          />
        </div>

        {/* Success message */}
        {saveSuccess && (
          <div
            data-ocid="profile.success_state"
            className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-semibold">
                Name saved!
              </p>
              <p className="text-green-600/70 dark:text-green-400/70 text-xs">
                Your display name has been updated to "{displayName.trim()}".
              </p>
            </div>
          </div>
        )}

        {/* Orientation Lock */}
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-base font-semibold text-foreground">
              Portrait Lock
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Keep screen in portrait orientation
            </p>
          </div>
          <button
            type="button"
            onClick={toggleLock}
            className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${isLocked ? "bg-primary" : "bg-muted"}`}
            role="switch"
            aria-checked={isLocked}
            data-ocid="profile.toggle"
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${isLocked ? "translate-x-7" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!displayName.trim()}
          data-ocid="profile.submit_button"
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity active:scale-[0.98]"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
