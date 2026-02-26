import React from 'react';
import { Loader2 } from 'lucide-react';
import ReceivedDownloadsList from './ReceivedDownloadsList';

export default function SettingsDownloadsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Received Files
        </h3>
        <p className="text-xs text-muted-foreground">
          Download files that were sent to you
        </p>
      </div>

      <ReceivedDownloadsList />
    </div>
  );
}
