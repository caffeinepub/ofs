import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './pages/Dashboard';
import OfflineDashboard from './pages/OfflineDashboard';
import LoginScreen from './components/LoginScreen';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BRANDING } from './constants/branding';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [showOfflineDashboard, setShowOfflineDashboard] = useState(false);

  const isAuthenticated = !!identity;

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Initializing {BRANDING.appName}...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show LoginScreen or OfflineDashboard for unauthenticated users
  if (!isAuthenticated) {
    if (showOfflineDashboard) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
            <main className="flex-1">
              <OfflineDashboard onBackToLogin={() => setShowOfflineDashboard(false)} />
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginScreen onEnterOffline={() => setShowOfflineDashboard(true)} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup if user doesn't have a profile or has invalid display name
  const hasInvalidProfile = userProfile && (!userProfile.displayName || userProfile.displayName.trim() === '');
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && (userProfile === null || hasInvalidProfile);

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileSetup />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show main application (authenticated)
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="flex-1">
          <Dashboard />
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
