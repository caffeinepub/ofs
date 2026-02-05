import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ArrowLeft } from 'lucide-react';
import OfflineFileShare from '../components/OfflineFileShare';
import { BRANDING } from '../constants/branding';

interface OfflineDashboardProps {
  onBackToLogin?: () => void;
}

export default function OfflineDashboard({ onBackToLogin }: OfflineDashboardProps) {
  return (
    <div className="container py-8">
      {onBackToLogin && (
        <div className="mb-6">
          <Button onClick={onBackToLogin} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      )}

      <div className="mb-8 flex items-center gap-3">
        <img src="/assets/generated/ofs-logo-transparent.dim_200x200.png" alt="OFS Logo" className="h-12 w-12" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{BRANDING.appNameWithAcronym}</h2>
          <p className="text-muted-foreground">{BRANDING.tagline}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You are in <strong>Offline mode</strong>. Files can be shared locally without requiring login or internet connection.
          </AlertDescription>
        </Alert>

        <OfflineFileShare />

        <Card>
          <CardHeader>
            <CardTitle>How Offline Sharing Works</CardTitle>
            <CardDescription>Share files without any network connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </div>
              <p>Select a file you want to share and export it as an Offline Share Package</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </div>
              <p>Share the exported package file with the receiver (via USB, Bluetooth, or any file transfer method)</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </div>
              <p>Receiver opens the package file in their browser to view and save the file to their device</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
