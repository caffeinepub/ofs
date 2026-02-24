import { BRANDING } from '../constants/branding';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center">
        <p className="text-center text-sm text-muted-foreground">
          © {BRANDING.appName} 2026
        </p>
      </div>
    </footer>
  );
}
