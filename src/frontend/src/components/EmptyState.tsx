import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  imagePath: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  imagePath,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <img
        src={imagePath}
        alt={title}
        className="w-full max-w-[300px] h-auto mb-6 opacity-80"
        loading="lazy"
      />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="h-12 px-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
