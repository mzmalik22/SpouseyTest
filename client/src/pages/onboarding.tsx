import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { relationshipConditionValues } from "@shared/schema";
import { HeartHandshake, AlertTriangle, ThumbsUp } from "lucide-react";

// Import RelationshipCondition type
import { RelationshipCondition } from "@shared/schema";

// Define type for form state
type OnboardingState = {
  relationshipCondition: RelationshipCondition | null;
};

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState<OnboardingState>({
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

    // Check if onboarding is completed
    if (user.onboardingCompleted) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // No step navigation needed for single-step

  const handleComplete = async () => {
    if (!state.relationshipCondition) {
      toast({
        title: "Please select an option",
        description: "Please select your relationship condition to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/onboarding", {
        // Use a default marital status since we don't ask for it anymore
        maritalStatus: "married", 
        relationshipCondition: state.relationshipCondition,
      });
      
      // Refresh user to get updated profile with onboardingCompleted flag
      await refreshUser();
      
      toast({
        title: "Onboarding completed",
        description: "Thank you for providing your information. We'll use this to personalize your experience.",
      });
      
      setLocation("/");
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

  // Render relationship health form
  const renderRelationshipHealthForm = () => (
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
          onValueChange={(value) => setState((prev) => ({ ...prev, relationshipCondition: value as RelationshipCondition }))}
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
      <CardFooter className="flex justify-end">
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

      {renderRelationshipHealthForm()}
    </div>
  );
}