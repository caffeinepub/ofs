import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmationDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[90vw] p-0 overflow-hidden border-0 rounded-2xl">
        {/* Red background header area */}
        <div className="bg-red-600 px-6 pt-6 pb-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Trash2 size={28} className="text-white" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-white text-xl font-bold">
              Delete File?
            </DialogTitle>
            <DialogDescription className="text-white/90 text-sm leading-snug">
              {fileName
                ? `Are you sure you want to delete "${fileName}"?`
                : 'Are you sure you want to delete this file?'}
              <br />
              <span className="text-white/75 text-xs">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Action buttons */}
        <DialogFooter className="flex flex-row gap-2 px-6 py-4 bg-white dark:bg-zinc-900">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-2"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </span>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
