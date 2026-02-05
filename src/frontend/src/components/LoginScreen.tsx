import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wifi } from 'lucide-react';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
            <img src="/assets/generated/ofs-logo-transparent.dim_200x200.png" alt="OFS Logo" className="h-16 w-16" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome to OFS</CardTitle>
            <CardDescription className="mt-2 text-base">
              Wireless file sharing made simple and secure
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Wifi className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Peer-to-Peer Transfer</p>
                <p className="text-xs text-muted-foreground">No cloud dependency</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <img
                src="/assets/generated/ai-compression-transparent.dim_64x64.png"
                alt="AI Compression"
                className="h-5 w-5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">AI Image Compression</p>
                <p className="text-xs text-muted-foreground">Reduce file sizes automatically</p>
              </div>
            </div>
          </div>

          <Button onClick={login} disabled={isLoggingIn} className="w-full" size="lg">
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Login to Get Started'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure authentication powered by Internet Identity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
