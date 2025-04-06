import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Coaching from "@/pages/coaching";
import Onboarding from "@/pages/onboarding";
import { useAuth, AuthProvider } from "./context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useIsMobile } from "./hooks/use-mobile";

// Layout component to handle different layouts for mobile vs desktop
function AppLayout({ children, isAuthPage = false }: { children: React.ReactNode, isAuthPage?: boolean }) {
  const isMobile = useIsMobile();

  // Simplified layout for auth pages
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <main className="flex-1 container mx-auto px-4 md:px-6 pb-16 pt-4">
        {children}
      </main>
      
      {/* Mobile navigation bar at bottom - fixed positioning */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-muted py-2 border-t border-border">
          <div className="container mx-auto flex justify-around items-center">
            <a href="/" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">🏠</span>
              <span className="text-xs text-muted-foreground">Home</span>
            </a>
            <a href="/messages" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">💬</span>
              <span className="text-xs text-muted-foreground">Messages</span>
            </a>
            <a href="/coaching" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">🧠</span>
              <span className="text-xs text-muted-foreground">Coaching</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Skip all redirects if loading
    if (loading) return;
    
    // Redirect to login if not authenticated
    if (!user && location !== "/login" && location !== "/register") {
      setLocation("/login");
      return;
    }

    // Redirect to dashboard if already authenticated and trying to access login/register
    if (user && (location === "/login" || location === "/register")) {
      setLocation("/");
      return;
    }
    
    // Redirect to onboarding if authenticated but onboarding not completed
    if (user && !user.onboardingCompleted && location !== "/onboarding") {
      setLocation("/onboarding");
      return;
    }
    
    // Redirect to dashboard if onboarding is completed but trying to access onboarding
    if (user && user.onboardingCompleted && location === "/onboarding") {
      setLocation("/");
      return;
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emotion-happy"></div>
      </div>
    );
  }

  // Determine if current page is an auth page
  const isAuthPage = location === "/login" || location === "/register" || location === "/onboarding";

  return (
    <AppLayout isAuthPage={isAuthPage}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Dashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/coaching" component={Coaching} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
