import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetOnlineUsers, useGetUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Wifi } from 'lucide-react';

function UserCard({ userPrincipal }: { userPrincipal: string }) {
  const { data: userProfile } = useGetUserProfile(
    userPrincipal ? ({ toString: () => userPrincipal } as any) : null
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <Avatar className="h-12 w-12">
        <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
        <AvatarFallback>{userProfile?.displayName ? getInitials(userProfile.displayName) : 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">{userProfile?.displayName || 'Anonymous User'}</p>
        <p className="text-xs text-muted-foreground">
          {userPrincipal.slice(0, 10)}...{userPrincipal.slice(-8)}
        </p>
      </div>
      <Badge variant="default" className="gap-1">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Online
      </Badge>
    </div>
  );
}

export default function OnlineUsers() {
  const { identity } = useInternetIdentity();
  const { data: onlineUsers, isLoading } = useGetOnlineUsers();

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const otherUsers = onlineUsers?.filter((user) => user.toString() !== currentUserPrincipal) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
          <CardDescription>Loading online users...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Online Users</CardTitle>
            <CardDescription>Users available for file sharing</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <Wifi className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{otherUsers.length} online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {otherUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No other users online</p>
            <p className="text-sm text-muted-foreground">Waiting for users to connect...</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {otherUsers.map((user) => (
                <UserCard key={user.toString()} userPrincipal={user.toString()} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
