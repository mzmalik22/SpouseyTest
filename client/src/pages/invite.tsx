import { useState, useEffect } from "react";
import { useLocation, useRoute, Redirect } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/invite/:code");
  const inviteCode = params?.code;
  
  const [loading, setLoading] = useState(true);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // If no invite code is provided, redirect to dashboard
  if (!inviteCode) {
    return <Redirect to="/" />;
  }

  useEffect(() => {
    const checkInviteCode = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Check if user is already connected with a partner
        if (user.partnerId) {
          setError("You are already connected with a partner. You cannot accept another invitation.");
          return;
        }
        
        // Just check if the invite code exists, but don't accept it yet
        const response = await apiRequest("GET", `/api/users/check-invite/${inviteCode}`);
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "This invitation is not valid.");
        }
      } catch (err) {
        setError("Could not validate the invitation code.");
        console.error("Invite validation error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkInviteCode();
  }, [user, inviteCode]);

  const handleAcceptInvite = async () => {
    if (!user) return;
    
    try {
      setAcceptLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/users/accept-invite", { inviteCode });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to accept invitation.");
        return;
      }
      
      setSuccess(true);
      toast({
        title: "Partner Connected!",
        description: "You are now connected with your partner.",
      });
      
      // Refresh user data
      await refreshUser();
      
      // Redirect to dashboard after a short delay
      setTimeout(() => setLocation("/"), 2000);
    } catch (err) {
      setError("Could not accept the invitation. Please try again.");
      console.error("Invite acceptance error:", err);
    } finally {
      setAcceptLoading(false);
    }
  };

  if (!user) {
    // User needs to log in first to accept the invite
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-black">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Partner Invitation</CardTitle>
            <CardDescription className="text-center">
              Please log in or create an account to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={() => setLocation(`/login?redirect=/invite/${inviteCode}`)} className="w-full" variant="default">
              Log In
            </Button>
            <Button onClick={() => setLocation(`/register?redirect=/invite/${inviteCode}`)} className="w-full" variant="outline">
              Create Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-black">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Partner Invitation</CardTitle>
          <CardDescription className="text-center">
            {loading ? "Validating invitation..." : 
             error ? "Invalid Invitation" :
             success ? "Invitation Accepted!" : "Accept this invitation to connect with your partner"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {loading ? (
            <Loader2 className="h-16 w-16 animate-spin text-emotion-happy" />
          ) : error ? (
            <div className="text-center space-y-3">
              <XCircle className="h-16 w-16 mx-auto text-emotion-angry" />
              <p className="text-emotion-angry">{error}</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-3">
              <CheckCircle className="h-16 w-16 mx-auto text-emotion-happy" />
              <p className="text-foreground">Successfully connected with your partner!</p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                You've been invited to connect with someone on Spousey. By accepting this invitation, 
                you'll be able to send messages and access shared coaching content.
              </p>
            </div>
          )}
        </CardContent>
        {!loading && !error && !success && (
          <CardFooter>
            <Button 
              onClick={handleAcceptInvite} 
              className="w-full"
              disabled={acceptLoading}
            >
              {acceptLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </CardFooter>
        )}
        {error && (
          <CardFooter>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              variant="outline"
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}