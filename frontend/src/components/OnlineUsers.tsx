import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useGetOnlineUsers, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import EmptyState from './EmptyState';
import type { Principal } from '@icp-sdk/core/principal';

interface UserRowProps {
  principal: Principal;
  currentUserPrincipal: string;
}

function UserRow({ principal, currentUserPrincipal }: UserRowProps) {
  const { data: profile } = useGetUserProfile(principal);
  const isCurrentUser = principal.toString() === currentUserPrincipal;

  const displayName = profile?.displayName || 'Anonymous';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
      {/* Avatar with initials */}
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-base font-semibold text-primary">{initials}</span>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground truncate">
            {displayName}
          </span>
          {isCurrentUser && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm text-muted-foreground">Online</span>
        </div>
      </div>
    </div>
  );
}

export default function OnlineUsers() {
  const { data: onlineUsers, isLoading, refetch } = useGetOnlineUsers();
  const { identity } = useInternetIdentity();
  const currentUserPrincipal = identity?.getPrincipal().toString() || '';

  const { isRefreshing, pullToRefreshProps } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" {...pullToRefreshProps}>
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground ml-2">Refreshing…</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-foreground">Online Users</h2>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-muted-foreground">
            {onlineUsers?.length ?? 0} online
          </span>
        </div>
      </div>

      {/* Users list */}
      <div className="flex flex-col gap-3 px-4 pb-4">
        {!onlineUsers || onlineUsers.length === 0 ? (
          <EmptyState
            imagePath="/assets/generated/empty-users.dim_300x200.png"
            title="No users online"
            description="You're the only one here right now. Share the app with friends to start transferring files!"
          />
        ) : (
          onlineUsers.map((principal) => (
            <UserRow
              key={principal.toString()}
              principal={principal}
              currentUserPrincipal={currentUserPrincipal}
            />
          ))
        )}
      </div>
    </div>
  );
}
