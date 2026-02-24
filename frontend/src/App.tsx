import { useEffect } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './pages/Dashboard';
import MobileMenu from './pages/MobileMenu';
import ProfilePage from './pages/ProfilePage';
import LoginScreen from './components/LoginScreen';
import OnboardingTutorial from './components/OnboardingTutorial';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BRANDING } from './constants/branding';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatusBar from './components/ConnectionStatusBar';
import { useOrientationLock } from './hooks/useOrientationLock';
import { useOnboarding } from './hooks/useOnboarding';

// Layout component for authenticated routes
function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <ConnectionStatusBar />
      <Header />
      <main className="flex-1 pb-20">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}

function MenuLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <ConnectionStatusBar />
      <Header />
      <main className="flex-1">
        <MobileMenu />
      </main>
      <Footer />
    </div>
  );
}

function ProfileLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <ConnectionStatusBar />
      <Header />
      <main className="flex-1">
        <ProfilePage />
      </main>
      <Footer />
    </div>
  );
}

// Create routes
const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AuthenticatedLayout,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/menu',
  component: MenuLayout,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileLayout,
});

const routeTree = rootRoute.addChildren([indexRoute, menuRoute, profileRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const isAuthenticated = !!identity;

  // Initialize orientation lock based on stored preference
  useOrientationLock();

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Initializing {BRANDING.appName}...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show LoginScreen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginScreen />
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

  // Show onboarding tutorial after profile setup for first-time users
  const shouldShowOnboarding = isAuthenticated && !profileLoading && isFetched && userProfile && showOnboarding;

  // Show main application (authenticated)
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster />
        {shouldShowOnboarding && (
          <OnboardingTutorial open={true} onComplete={completeOnboarding} />
        )}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
