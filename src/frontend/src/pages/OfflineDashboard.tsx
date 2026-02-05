import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import OfflineFileShare from '../components/OfflineFileShare';

export default function OfflineDashboard() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Offline File Sharing</h2>
        <p className="text-muted-foreground">Share files without internet connection</p>
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
