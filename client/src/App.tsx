import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Coaching from "@/pages/coaching";
import TherapistPage from "@/pages/therapist-page";
import CalendarPage from "@/pages/calendar-page";
import Onboarding from "@/pages/onboarding";
import Invite from "@/pages/invite";
import { useAuth, AuthProvider } from "./context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useIsMobile } from "./hooks/use-mobile";
import { isNativePlatform } from "./lib/capacitor";
import { TopNavigation } from "@/components/top-navigation";

// Layout component to handle different layouts for mobile vs desktop
function AppLayout({ children, isAuthPage = false }: { children: React.ReactNode, isAuthPage?: boolean }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();

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
      {/* Desktop top navigation - only for authenticated non-auth pages */}
      {!isMobile && !isNativePlatform() && <TopNavigation />}
      
      <main className="flex-1 container mx-auto px-4 md:px-6 pb-16 pt-4">
        {children}
      </main>
      
      {/* Mobile navigation bar at bottom - fixed positioning */}
      {(isMobile || isNativePlatform()) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-muted py-2 border-t border-border">
          <div className="container mx-auto flex justify-around items-center">
            <Link href="/" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">🏠</span>
              <span className="text-xs text-muted-foreground">Home</span>
            </Link>
            <Link href="/messages" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">💬</span>
              <span className="text-xs text-muted-foreground">Messages</span>
            </Link>
            <Link href="/calendar" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">📅</span>
              <span className="text-xs text-muted-foreground">Calendar</span>
            </Link>
            <Link href="/coaching" className="flex flex-col items-center p-2">
              <span className="h-6 w-6 text-white">🧠</span>
              <span className="text-xs text-muted-foreground">Coaching</span>
            </Link>
            {user?.seesTherapist && (
              <Link href="/therapist" className="flex flex-col items-center p-2">
                <span className="h-6 w-6 text-white">👨‍⚕️</span>
                <span className="text-xs text-muted-foreground">Therapist</span>
              </Link>
            )}
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
    
    // Don't redirect if on an invite page
    if (location.startsWith("/invite/")) {
      return;
    }
    
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
    
    // Check if authenticated user needs to do onboarding
    if (user) {
      // Handle initial onboarding
      if (!user.onboardingCompleted && location !== "/onboarding") {
        setLocation("/onboarding");
        return;
      }
      
      // Check if we need to prompt for relationship status again, but only once per session
      // Only ask again if user is on dashboard and it's been more than 5 days
      if (user.onboardingCompleted && location === "/" && !isOnOnboardingCooldown() && 
          !sessionStorage.getItem('checkedRelationshipStatusThisSession')) {
        // Mark that we've checked this session to avoid loops
        sessionStorage.setItem('checkedRelationshipStatusThisSession', 'true');
        // Reset last prompt time and redirect to onboarding
        localStorage.removeItem('lastRelationshipPrompt');
        setLocation("/onboarding");
        return;
      }
      
      // Redirect to dashboard if onboarding is completed but trying to access onboarding
      // and not being forced to update relationship status
      if (user.onboardingCompleted && location === "/onboarding" && isOnOnboardingCooldown()) {
        setLocation("/");
        return;
      }
    }
  }, [user, loading, location, setLocation]);
  
  // Helper function to determine if we should ask about relationship
  // Returns true if we've asked within the last 5 days
  function isOnOnboardingCooldown(): boolean {
    const lastPromptStr = localStorage.getItem('lastRelationshipPrompt');
    if (!lastPromptStr) return false;
    
    try {
      const lastPromptDate = new Date(lastPromptStr);
      const now = new Date();
      
      // Calculate days between lastPrompt and now
      const differenceInMs = now.getTime() - lastPromptDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
      
      // If it's been less than 5 days, we're on cooldown
      return differenceInDays < 5;
    } catch (error) {
      console.error("Error parsing last prompt date:", error);
      return false; // If there's an error, default to showing the prompt
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emotion-happy"></div>
      </div>
    );
  }

  // Determine if current page is an auth page or invite page
  const isAuthPage = location === "/login" || location === "/register" || location === "/onboarding" || location.startsWith("/invite/");

  return (
    <AppLayout isAuthPage={isAuthPage}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/invite/:code" component={Invite} />
        <Route path="/" component={Dashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/coaching" component={Coaching} />
        <Route path="/therapist" component={TherapistPage} />
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
