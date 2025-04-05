import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { UserRound, HeartHandshake } from "lucide-react";

interface NicknameFormProps {
  onSaved?: () => void;
}

export default function NicknameForm({ onSaved }: NicknameFormProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [partnerNickname, setPartnerNickname] = useState(user?.partnerNickname || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname && !partnerNickname) {
      toast({
        title: "Please enter at least one nickname",
        description: "You need to provide either your nickname or your partner's nickname",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const payload: { nickname?: string; partnerNickname?: string } = {};
      if (nickname) payload.nickname = nickname;
      if (partnerNickname) payload.partnerNickname = partnerNickname;
      
      const response = await apiRequest("POST", "/api/user/nickname", payload);
      const updatedUser = await response.json();
      
      // Update the user in the cache
      queryClient.setQueryData(["/api/auth/current-user"], updatedUser);
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      toast({
        title: "Nicknames saved",
        description: "Your nickname settings have been updated",
        variant: "default",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error saving nicknames:", error);
      toast({
        title: "Failed to save nicknames",
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
        <CardTitle className="text-white">Personalize Your Experience</CardTitle>
        <CardDescription>
          Set nicknames to personalize message refinements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Your Nickname
            </Label>
            <Input
              id="nickname"
              placeholder="What do you call yourself? (e.g., Babe, Honey)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-black/50 border-border text-white"
            />
            <p className="text-xs text-muted-foreground">
              This is how you'll be referred to in refined messages
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="partnerNickname" className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              Partner's Nickname
            </Label>
            <Input
              id="partnerNickname"
              placeholder="What do you call your partner? (e.g., Sweetheart, Darling)"
              value={partnerNickname}
              onChange={(e) => setPartnerNickname(e.target.value)}
              className="bg-black/50 border-border text-white"
            />
            <p className="text-xs text-muted-foreground">
              This is how your partner will be referred to in refined messages
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full hwf-button"
          >
            {isSaving ? "Saving..." : "Save Nicknames"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}