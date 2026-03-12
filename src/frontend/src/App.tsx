import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import MobileMenu from "./pages/MobileMenu";
import ProfilePage from "./pages/ProfilePage";
import ReceivePage from "./pages/ReceivePage";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

// ---- Layouts ----
function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20">
        <Dashboard />
      </main>
    </div>
  );
}

function MenuLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <MobileMenu
          onNavigateToProfile={() => navigate({ to: "/profile" })}
          onClose={() => navigate({ to: "/" })}
        />
      </main>
    </div>
  );
}

function ProfileLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ProfilePage onBack={() => navigate({ to: "/" })} />
      </main>
    </div>
  );
}

// ---- Router ----
const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AuthenticatedLayout,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  component: MenuLayout,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileLayout,
});

const receiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/receive",
  component: ReceivePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  menuRoute,
  profileRoute,
  receiveRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ---- Root App ----
export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
