import { useGetOnlineUsers, useGetMultipleUserProfiles } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';

export default function OnlineUsers() {
  const { identity } = useInternetIdentity();
  const { data: onlineUsers, isLoading, refetch } = useGetOnlineUsers();
  const currentUserPrincipal = identity?.getPrincipal().toString();
  const availableUsers = onlineUsers?.filter((user) => user.toString() !== currentUserPrincipal) || [];
  
  const { data: userProfilesMap, isLoading: profilesLoading } = useGetMultipleUserProfiles(availableUsers);

  const { isRefreshing, pullToRefreshProps } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Online Users</h2>
          <p className="text-sm text-muted-foreground">Users available for file sharing</p>
        </div>
        {isRefreshing && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      <div {...pullToRefreshProps} className="space-y-3 touch-pan-y">
        {isLoading || profilesLoading ? (
          <>
            <SkeletonCard height="80px" />
            <SkeletonCard height="80px" />
            <SkeletonCard height="80px" />
          </>
        ) : availableUsers.length === 0 ? (
          <EmptyState
            imagePath="/assets/generated/empty-users.dim_300x200.png"
            title="No users online"
            description="Other users will appear here when they're online and available for file sharing."
          />
        ) : (
          availableUsers.map((principal) => {
            const profile = userProfilesMap?.[principal.toString()];
            return (
              <Card key={principal.toString()} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="text-lg">
                        {profile?.displayName ? getInitials(profile.displayName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {profile?.displayName || principal.toString().slice(0, 12) + '...'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <span className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                          Online
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
