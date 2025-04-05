import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { HeartHandshake, Plus } from "lucide-react";

interface NicknameFormProps {
  onSaved?: () => void;
}

// Common pet names/terms of endearment for suggestions
const NICKNAME_SUGGESTIONS = [
  "Sweetheart", 
  "Honey", 
  "Babe", 
  "Darling", 
  "Love", 
  "Cutie", 
  "Dear"
];

export default function NicknameForm({ onSaved }: NicknameFormProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [partnerNickname, setPartnerNickname] = useState(user?.partnerNickname || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSuggestionClick = (suggestion: string) => {
    setPartnerNickname(suggestion);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerNickname.trim()) {
      toast({
        title: "Please enter a nickname",
        description: "You need to provide a nickname for your partner",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Set a default nickname for yourself if not already set
      const payload: { partnerNickname: string; nickname?: string } = {
        partnerNickname: partnerNickname.trim()
      };
      
      // Keep existing self nickname if present
      if (user?.nickname) {
        payload.nickname = user.nickname;
      } else {
        // Default to "Me" if no nickname set
        payload.nickname = "Me";
      }
      
      const response = await apiRequest("POST", "/api/user/nickname", payload);
      const updatedUser = await response.json();
      
      // Update the user in the cache
      queryClient.setQueryData(["/api/auth/current-user"], updatedUser);
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      toast({
        title: "Nickname saved",
        description: `Your partner will be called "${partnerNickname}" in messages`,
        variant: "default",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error saving nicknames:", error);
      toast({
        title: "Failed to save nickname",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="bg-muted border-border">
      <CardHeader>
        <CardTitle className="text-white">Personalize Messages</CardTitle>
        <CardDescription>
          What do you call your partner? This helps personalize message refinements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="partnerNickname" className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              Partner's Nickname
            </Label>
            <Input
              id="partnerNickname"
              placeholder="What do you call your partner?"
              value={partnerNickname}
              onChange={(e) => setPartnerNickname(e.target.value)}
              className="bg-black/50 border-border text-white"
            />
            
            {/* Nickname suggestions */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {NICKNAME_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-black/30 hover:bg-black/50 border-border text-white text-xs py-1 h-auto"
                  >
                    {suggestion}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPartnerNickname("")}
                  className="bg-black/30 hover:bg-black/50 border-border text-white text-xs py-1 h-auto"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Other
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              This is how your partner will be referred to in refined messages
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full hwf-button mt-4"
          >
            {isSaving ? "Saving..." : "Save Nickname"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}