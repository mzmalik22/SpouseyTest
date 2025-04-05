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
import { useAuth, AuthProvider } from "./context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user && location !== "/login" && location !== "/register") {
      setLocation("/login");
    }

    // Redirect to dashboard if already authenticated and trying to access login/register
    if (!loading && user && (location === "/login" || location === "/register")) {
      setLocation("/");
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Dashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/coaching/:id" component={Coaching} />
      <Route component={NotFound} />
    </Switch>
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
