import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { formatFileSize } from '../utils/fileSizeValidation';

interface NetworkWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  fileSize: number;
  connectionType: string;
  isMetered: boolean;
}

export default function NetworkWarningDialog({
  isOpen,
  onClose,
  onProceed,
  fileSize,
  connectionType,
  isMetered,
}: NetworkWarningDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-warning/10 p-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <AlertDialogTitle>Slow Connection Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              You're about to upload a <strong>{formatFileSize(fileSize)}</strong> file on a{' '}
              <strong>{connectionType.toUpperCase()}</strong> connection
              {isMetered && ' with data saver enabled'}.
            </p>
            <p className="text-sm">
              This may result in:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Slow upload speeds</li>
              <li>Higher data usage</li>
              <li>Potential timeout errors</li>
            </ul>
            <p className="text-sm font-medium">
              Consider using the AI compression feature to reduce file size before uploading.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="h-12">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onProceed} className="h-12">
            Upload Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
