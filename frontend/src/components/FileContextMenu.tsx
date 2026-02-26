import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { Download, Share2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TransferRecordData } from '../backend';
import { useWebShare } from '../hooks/useWebShare';

interface FileContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: TransferRecordData | null;
  onDownload: () => void;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
}

export default function FileContextMenu({
  open,
  onOpenChange,
  file,
  onDownload,
  onDelete,
  isDeleting = false,
}: FileContextMenuProps) {
  const { isShareSupported, shareFile } = useWebShare();
  const [isSharing, setIsSharing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleShare = async () => {
    if (!file) return;

    setIsSharing(true);
    try {
      const bytes = await file.file.blob.getBytes();
      await shareFile({
        name: file.file.name,
        type: file.file.fileType,
        size: file.file.size,
        blob: bytes,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Share failed:', error);
      if (error.message !== 'User cancelled') {
        toast.error('Failed to share file');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDeleteClick = () => {
    // Close the sheet first, then open the red confirmation dialog
    onOpenChange(false);
    setTimeout(() => setConfirmDeleteOpen(true), 200);
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    if (onDelete) {
      await onDelete();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="safe-bottom">
          <SheetHeader>
            <SheetTitle className="truncate">{file?.file.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-14 text-base"
              onClick={onDownload}
            >
              <Download className="mr-3 h-5 w-5" />
              <span>Download</span>
            </Button>

            {isShareSupported && (
              <Button
                variant="ghost"
                className="w-full justify-start h-14 text-base"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    <span>Sharing…</span>
                  </>
                ) : (
                  <>
                    <Share2 className="mr-3 h-5 w-5" />
                    <span>Share</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start h-14 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <Trash2 className="mr-3 h-5 w-5" />
                  <span>Delete</span>
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Red background confirmation dialog */}
      <DeleteConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        fileName={file?.file.name}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
