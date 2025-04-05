import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { vibeOptions, VibeOption } from "@/lib/types";
import VibePill from "./vibe-pill";
import { Send, ChevronDown, ChevronUp, Smile } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MessageComposerProps {
  onMessageSent: () => void;
}

export default function MessageComposer({ onMessageSent }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [enableRefinement, setEnableRefinement] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
  const [refinedMessage, setRefinedMessage] = useState("");
  const [originalMessage, setOriginalMessage] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Reset message composer after sending
  const resetComposer = () => {
    setMessage("");
    setRefinedMessage("");
    setOriginalMessage("");
    setSelectedVibe(null);
    setIsRefining(false);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Refine message based on selected vibe using OpenAI API
  const refineMessage = async () => {
    if (!message.trim() || !selectedVibe) return;
    
    setIsRefining(true);
    setOriginalMessage(message);
    
    try {
      // Call our message refinement API endpoint
      const response = await apiRequest<{ refinedMessage: string }>("POST", "/api/messages/refine", {
        message: message.trim(),
        vibe: selectedVibe.id,
      });
      
      // Update with the AI-refined message
      if (response && response.refinedMessage) {
        setRefinedMessage(response.refinedMessage);
      } else {
        // If something went wrong, use the original
        setRefinedMessage(message);
      }
    } catch (error) {
      console.error("Error refining message:", error);
      toast({
        variant: "destructive",
        title: "Message refinement failed",
        description: "Using your original message instead.",
      });
      // If refinement fails, use the original message
      setRefinedMessage(message);
    } finally {
      setIsRefining(false);
    }
  };

  // Effect to refine message when vibe changes
  useEffect(() => {
    if (enableRefinement && selectedVibe && message) {
      refineMessage();
    } else {
      setRefinedMessage("");
      setOriginalMessage("");
    }
  }, [selectedVibe, enableRefinement, message]);

  // Send the message
  const sendMessage = async () => {
    const messageToSend = enableRefinement && refinedMessage ? refinedMessage : message;
    
    if (!messageToSend.trim()) {
      toast({
        variant: "destructive",
        title: "Can't send empty message",
        description: "Please type a message before sending.",
      });
      return;
    }
    
    try {
      setIsSending(true);
      
      await apiRequest("POST", "/api/messages", {
        content: messageToSend,
        vibe: selectedVibe?.name,
        originalContent: originalMessage || undefined,
      });
      
      // Invalidate messages cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      // Reset the composer
      resetComposer();
      
      // Notify parent component
      onMessageSent();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again later.",
      });
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle vibe selection
  const handleVibeClick = (vibe: VibeOption) => {
    setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe);
  };

  // State for expanded view
  const [expandedVibes, setExpandedVibes] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Top 4 vibes for initial view
  const topVibes = vibeOptions.slice(0, 4);
  // Remaining vibes for expanded view
  const moreVibes = vibeOptions.slice(4);

  return (
    <div className="border-t border-border p-4 bg-black">
      {/* Message Preview */}
      {enableRefinement && refinedMessage && (
        <div className="mb-4 p-3 bg-muted rounded-xl border border-border">
          <p className="text-sm text-white">{refinedMessage}</p>
          {originalMessage && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">Original: "{originalMessage}"</span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-muted-foreground hover:text-white"
                onClick={() => {
                  setMessage(originalMessage);
                  setRefinedMessage("");
                  setOriginalMessage("");
                  setSelectedVibe(null);
                }}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Vibe Selection Dialog */}
      {enableRefinement && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 mb-2 ${selectedVibe ? 'bg-muted text-white' : ''}`}
              onClick={() => setDialogOpen(true)}
            >
              <Smile className="w-4 h-4" />
              {selectedVibe ? `${selectedVibe.name} vibe` : "Choose a vibe"}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-muted border-border">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-white">Choose a message vibe</h3>
              
              {/* Show refined message preview if available */}
              {refinedMessage && (
                <div className="p-3 bg-black/50 rounded-lg border border-border">
                  <p className="text-sm text-white mb-1">{refinedMessage}</p>
                  <p className="text-xs text-muted-foreground italic">Your message with {selectedVibe?.name} vibe</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {/* Initial top vibes */}
                {topVibes.map((vibe) => (
                  <VibePill
                    key={vibe.id}
                    vibe={vibe}
                    isSelected={selectedVibe?.id === vibe.id}
                    onClick={(selectedVibe) => {
                      handleVibeClick(selectedVibe);
                      if (!message) setDialogOpen(false);
                    }}
                  />
                ))}
                
                {/* More vibes (expandable) */}
                {expandedVibes && moreVibes.map((vibe) => (
                  <VibePill
                    key={vibe.id}
                    vibe={vibe}
                    isSelected={selectedVibe?.id === vibe.id}
                    onClick={(selectedVibe) => {
                      handleVibeClick(selectedVibe);
                      if (!message) setDialogOpen(false);
                    }}
                  />
                ))}
              </div>
              
              {/* Show/Hide More Button */}
              {moreVibes.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-center gap-1 text-xs"
                  onClick={() => setExpandedVibes(!expandedVibes)}
                >
                  {expandedVibes ? (
                    <>Show less <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>Show more vibes <ChevronDown className="h-3 w-3" /></>
                  )}
                </Button>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="default"
                  className="hwf-button"
                  onClick={() => setDialogOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Input */}
      <div className="flex items-end">
        <div className="flex-1 mr-2">
          <Textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 border border-border bg-muted text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            rows={2}
          />
        </div>
        <Button
          onClick={sendMessage}
          disabled={isSending || isRefining || (!message && !refinedMessage)}
          className="hwf-button h-12 w-12 !bg-white !text-black !rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Refinement Toggle */}
      <div className="flex items-center mt-3">
        <Switch
          id="refinement-toggle"
          checked={enableRefinement}
          onCheckedChange={setEnableRefinement}
          className="mr-2"
        />
        <Label
          htmlFor="refinement-toggle"
          className="text-xs text-muted-foreground cursor-pointer"
        >
          Message refinement
        </Label>
      </div>
    </div>
  );
}
