import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { relationshipConditionValues, maritalStatusValues } from "@shared/schema";
import { HeartHandshake, AlertTriangle, ThumbsUp, Heart, Users } from "lucide-react";

// Import RelationshipCondition type
import { RelationshipCondition, MaritalStatus } from "@shared/schema";

// Define type for form state
type OnboardingState = {
  relationshipCondition: RelationshipCondition | null;
  maritalStatus: MaritalStatus | null;
  step: 1 | 2;
};

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    relationshipCondition: null,
    maritalStatus: null,
    step: 1
  });
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Setup component based on whether this is initial onboarding or an update
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    // If the user has already been onboarded and is returning, we're updating
    if (user.onboardingCompleted) {
      setIsUpdating(true);
      
      // Pre-fill with existing values if this is an update
      setState(prev => ({
        ...prev,
        maritalStatus: (user.maritalStatus as MaritalStatus) || null,
        relationshipCondition: (user.relationshipCondition as RelationshipCondition) || null,
        // Skip to relationship question for updates
        step: 2
      }));
    }
  }, [user, setLocation]);

  // Navigate to next step
  const handleNextStep = () => {
    if (!state.maritalStatus) {
      toast({
        title: "Please select your marital status",
        description: "Please select your current marital status to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setState(prev => ({ ...prev, step: 2 }));
  };

  // Handle back to previous step
  const handleBackStep = () => {
    setState(prev => ({ ...prev, step: 1 }));
  };

  // Complete onboarding and save data
  const handleComplete = async () => {
    if (!state.relationshipCondition) {
      toast({
        title: "Please select an option",
        description: "Please select your relationship condition to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!state.maritalStatus) {
      toast({
        title: "Missing information",
        description: "Please go back and select your marital status.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/onboarding", {
        maritalStatus: state.maritalStatus, 
        relationshipCondition: state.relationshipCondition,
      });

      // Save last asked time to localStorage
      const now = new Date().toISOString();
      localStorage.setItem('lastRelationshipPrompt', now);
      
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

  // Render marital status form (Step 1)
  const renderMaritalStatusForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Your Relationship Status</CardTitle>
        <CardDescription className="text-center">
          What is your current marital or relationship status?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={state.maritalStatus || ""}
          onValueChange={(value) => setState((prev) => ({ ...prev, maritalStatus: value as MaritalStatus }))}
          className="space-y-3"
        >
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "single" ? "border-blue-400" : ""
            }`}
          >
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Single</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "dating" ? "border-purple-400" : ""
            }`}
          >
            <RadioGroupItem value="dating" id="dating" />
            <Label htmlFor="dating" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-500" />
                <span>Dating</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "engaged" ? "border-pink-400" : ""
            }`}
          >
            <RadioGroupItem value="engaged" id="engaged" />
            <Label htmlFor="engaged" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <span>Engaged</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "married" ? "border-green-400" : ""
            }`}
          >
            <RadioGroupItem value="married" id="married" />
            <Label htmlFor="married" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-500" />
                <span>Married</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "divorced" ? "border-orange-400" : ""
            }`}
          >
            <RadioGroupItem value="divorced" id="divorced" />
            <Label htmlFor="divorced" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-orange-500" />
                <span>Divorced</span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors ${
              state.maritalStatus === "widowed" ? "border-gray-400" : ""
            }`}
          >
            <RadioGroupItem value="widowed" id="widowed" />
            <Label htmlFor="widowed" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-gray-500" />
                <span>Widowed</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNextStep} disabled={loading || !state.maritalStatus}>
          Next
        </Button>
      </CardFooter>
    </Card>
  );

  // Render relationship health form (Step 2)
  const renderRelationshipHealthForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {isUpdating ? "How is your relationship doing?" : "Current Relationship Health"}
        </CardTitle>
        <CardDescription className="text-center">
          {isUpdating 
            ? "Has your relationship condition changed since you last checked in?" 
            : "How would you describe your current relationship condition?"
          }
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
      <CardFooter className={`flex ${isUpdating ? 'justify-end' : 'justify-between'}`}>
        {!isUpdating && (
          <Button 
            onClick={handleBackStep} 
            variant="outline"
            disabled={loading}
          >
            Back
          </Button>
        )}
        <Button 
          onClick={handleComplete} 
          disabled={loading || !state.relationshipCondition || !state.maritalStatus}
        >
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
        <h1 className="text-3xl font-bold tracking-tight">
          {isUpdating ? "Relationship Check-In" : "Welcome to Spousey"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isUpdating 
            ? "We'd like to check in on your relationship status to better help you" 
            : "Let's get to know you better so we can personalize your experience"
          }
        </p>
      </div>

      {/* Step indicator - only show if we're on initial onboarding, not for updates */}
      {!isUpdating && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.step === 1 ? 'bg-emotion-happy text-black' : 'bg-muted text-white'}`}>
              1
            </div>
            <div className="w-8 h-1 bg-muted"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.step === 2 ? 'bg-emotion-happy text-black' : 'bg-muted text-white'}`}>
              2
            </div>
          </div>
        </div>
      )}

      {state.step === 1 ? renderMaritalStatusForm() : renderRelationshipHealthForm()}
    </div>
  );
}