import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { BRANDING } from '../constants/branding';

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
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome to {BRANDING.appName}</CardTitle>
            <CardDescription className="mt-2 text-base">
              {BRANDING.tagline}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
