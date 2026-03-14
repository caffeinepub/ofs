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

function HomeLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      <Header />
      <main style={{ flex: 1, paddingBottom: "80px" }}>
        <Dashboard />
      </main>
    </div>
  );
}

function MenuLayout() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      <Header />
      <main style={{ flex: 1 }}>
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
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      <Header />
      <main style={{ flex: 1 }}>
        <ProfilePage onBack={() => navigate({ to: "/" })} />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeLayout,
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

export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
