import { useState } from "react";

const PROFILE_KEY = "ofs_profile";
const DEFAULT_NAME = "User";

export interface LocalProfile {
  displayName: string;
}

export function useLocalProfile() {
  const [profile, setProfileState] = useState<LocalProfile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      return stored ? JSON.parse(stored) : { displayName: DEFAULT_NAME };
    } catch {
      return { displayName: DEFAULT_NAME };
    }
  });

  const setProfile = (name: string) => {
    const newProfile: LocalProfile = { displayName: name };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    setProfileState(newProfile);
  };

  const clearProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    setProfileState({ displayName: DEFAULT_NAME });
  };

  return { profile, setProfile, clearProfile };
}
