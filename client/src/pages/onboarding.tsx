import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { maritalStatusValues, relationshipConditionValues } from "@shared/schema";
import { HeartHandshake, AlertTriangle, ThumbsUp } from "lucide-react";

// Import MaritalStatus and RelationshipCondition types
import { MaritalStatus, RelationshipCondition } from "@shared/schema";

// Define type for form state
type OnboardingState = {
  step: number;
  maritalStatus: MaritalStatus | null;
  relationshipCondition: RelationshipCondition | null;
};

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    maritalStatus: null,
    relationshipCondition: null,
  });
  const [loading, setLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if user is not logged in or has already completed onboarding
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    // Check if onboarding is completed (once we add this field to the User type)
    if (user.onboardingCompleted) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleNext = () => {
    if (state.step === 1 && !state.maritalStatus) {
      toast({
        title: "Please select an option",
        description: "Please select your marital status to continue.",
        variant: "destructive",
      });
      return;
    }

    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: prev.step - 1 }));
  };

  const handleComplete = async () => {
    if (!state.relationshipCondition) {
      toast({
        title: "Please select an option",
        description: "Please select your relationship condition to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!state.maritalStatus || !state.relationshipCondition) {
      // This shouldn't happen due to the validations above, but TypeScript needs it
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/onboarding", {
        maritalStatus: state.maritalStatus,
        relationshipCondition: state.relationshipCondition,
      });
      
      // Refresh user to get updated profile with onboardingCompleted flag
      await refreshUser();
      
      toast({
        title: "Onboarding completed",
        description: "Thank you for providing your information. We'll use this to personalize your experience.",
      });
      
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render marital status step
  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Your Relationship Status</CardTitle>
        <CardDescription className="text-center">
          Help us understand your current relationship situation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={state.maritalStatus || ""}
          onValueChange={(value) => setState((prev) => ({ ...prev, maritalStatus: value }))}
          className="space-y-3"
        >
          {maritalStatusValues.map((status) => (
            <div key={status} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={status} id={status} />
              <Label htmlFor={status} className="flex-1 cursor-pointer capitalize">
                {status}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNext} disabled={!state.maritalStatus}>
          Next
        </Button>
      </CardFooter>
    </Card>
  );

  // Render relationship condition step
  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Current Relationship Health</CardTitle>
        <CardDescription className="text-center">
          How would you describe your current relationship condition?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={state.relationshipCondition || ""}
          onValueChange={(value) => setState((prev) => ({ ...prev, relationshipCondition: value }))}
          className="space-y-3"
        >
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.relationshipCondition === "critical" ? "border-red-400" : ""
            }`}
          >
            <RadioGroupItem value="critical" id="critical" />
            <Label htmlFor="critical" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Critical - We need serious help</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.relationshipCondition === "stable" ? "border-amber-400" : ""
            }`}
          >
            <RadioGroupItem value="stable" id="stable" />
            <Label htmlFor="stable" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-amber-500" />
                <span>Stable - We're okay but want advice</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.relationshipCondition === "improving" ? "border-green-400" : ""
            }`}
          >
            <RadioGroupItem value="improving" id="improving" />
            <Label htmlFor="improving" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                <span>Improving - We want to get even better</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading || !state.relationshipCondition}>
          {loading ? "Saving..." : "Complete"}
        </Button>
      </CardFooter>
    </Card>
  );

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Spousey</h1>
        <p className="text-muted-foreground mt-2">
          Let's get to know you better so we can personalize your experience
        </p>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div 
            className={`rounded-full h-8 w-8 flex items-center justify-center ${
              state.step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <div className={`h-1 w-16 ${state.step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
          <div 
            className={`rounded-full h-8 w-8 flex items-center justify-center ${
              state.step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
        </div>
      </div>

      {state.step === 1 && renderStep1()}
      {state.step === 2 && renderStep2()}
    </div>
  );
}