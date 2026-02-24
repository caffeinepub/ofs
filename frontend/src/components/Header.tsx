import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { BRANDING } from '../constants/branding';
import { useRequestIndicator } from '../hooks/useRequestIndicator';

export default function Header() {
  const { identity } = useInternetIdentity();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { isLoading } = useRequestIndicator();

  const isAuthenticated = !!identity;

  const handleMenuClick = () => {
    navigate({ to: '/menu' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/assets/generated/ofs-logo-transparent.dim_200x200.png" alt="OFS Logo" className="h-10 w-10" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">{BRANDING.appNameShort}</h1>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-11 w-11"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Menu Button with Background */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMenuClick}
              className="h-11 w-11 bg-primary/10 hover:bg-primary/20"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
