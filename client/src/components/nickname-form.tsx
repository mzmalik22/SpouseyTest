import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { HeartHandshake, Plus, X } from "lucide-react";

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
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize nicknames from user data
  useEffect(() => {
    if (user?.partnerNickname) {
      // Split by comma if there are multiple nicknames stored
      const savedNicknames = user.partnerNickname.split(',').map(n => n.trim()).filter(Boolean);
      setNicknames(savedNicknames);
    }
  }, [user?.partnerNickname]);
  
  const handleSuggestionClick = (suggestion: string) => {
    if (!nicknames.includes(suggestion)) {
      setNicknames([...nicknames, suggestion]);
    }
    setInputValue("");
  };
  
  const handleAddNickname = () => {
    if (inputValue.trim() && !nicknames.includes(inputValue.trim())) {
      setNicknames([...nicknames, inputValue.trim()]);
      setInputValue("");
    }
  };
  
  const handleRemoveNickname = (index: number) => {
    const newNicknames = [...nicknames];
    newNicknames.splice(index, 1);
    setNicknames(newNicknames);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddNickname();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nicknames.length === 0) {
      toast({
        title: "Please add at least one nickname",
        description: "You need to provide at least one nickname for your partner",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Join multiple nicknames with commas
      const partnerNickname = nicknames.join(', ');
      
      // Set a default nickname for yourself if not already set
      const payload: { partnerNickname: string; nickname?: string } = {
        partnerNickname
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
        title: "Nicknames saved",
        description: `Partner nicknames have been updated successfully`,
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
        <CardTitle className="text-white">Personalize Messages</CardTitle>
        <CardDescription>
          What do you call your partner? Add multiple nicknames to personalize message refinements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="partnerNickname" className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              Partner's Nicknames
            </Label>
            
            {/* Selected nicknames display */}
            {nicknames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {nicknames.map((nickname, index) => (
                  <div 
                    key={`${nickname}-${index}`} 
                    className="flex items-center bg-black/40 text-white text-sm px-3 py-1 rounded-full border border-border"
                  >
                    <span>{nickname}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveNickname(index)}
                      className="ml-2 text-muted-foreground hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Input field with add button */}
            <div className="flex gap-2">
              <Input
                id="partnerNickname"
                placeholder="Add a new nickname..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-black/50 border-border text-white flex-1"
              />
              <Button
                type="button"
                onClick={handleAddNickname}
                disabled={!inputValue.trim()}
                className="bg-black/30 hover:bg-black/50 border-border"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Nickname suggestions */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {NICKNAME_SUGGESTIONS.filter(s => !nicknames.includes(s)).map((suggestion) => (
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
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              Your partner will be referred to by these nicknames in message refinements
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full hwf-button mt-4"
          >
            {isSaving ? "Saving..." : "Save Nicknames"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}