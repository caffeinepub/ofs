import { User, Wifi, WifiOff } from "lucide-react";
import React from "react";
import { useLocalProfile } from "../hooks/useLocalProfile";
import {
  useGetMultipleUserProfiles,
  useGetOnlineUsers,
} from "../hooks/useQueries";

export default function OnlineUsers() {
  const { data: onlinePrincipals = [], isLoading } = useGetOnlineUsers();
  const { data: profiles = {} } = useGetMultipleUserProfiles(onlinePrincipals);
  const { profile: localProfile } = useLocalProfile();

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Online Users</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {onlinePrincipals.length} online
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : onlinePrincipals.length === 0 ? (
        <div
          data-ocid="users.empty_state"
          className="flex flex-col items-center justify-center py-16 gap-3 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No users online</p>
          <p className="text-sm text-muted-foreground">
            Share the app link with others to see them here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {onlinePrincipals.map((principal, idx) => {
            const profileData = profiles[principal.toString()];
            const name =
              (profileData as { displayName?: string } | null)?.displayName ||
              `User ${idx + 1}`;
            const isYou = localProfile?.displayName === name;
            return (
              <div
                key={principal.toString()}
                data-ocid={`users.item.${idx + 1}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-foreground truncate">
                    {name}
                    {isYou && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
