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
  DialogTitle,
  DialogDescription,
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

  // Check if message is ready and show vibe selection
  const prepareToSend = () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Can't send empty message",
        description: "Please type a message before sending.",
      });
      return;
    }
    
    // If refinement is disabled or we already have a vibe selected, send directly
    if (!enableRefinement || selectedVibe) {
      sendMessage();
    } else {
      // Otherwise, show the vibe selection dialog
      setDialogOpen(true);
    }
  };
  
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
      
      {/* Vibe Selection Dialog - No visible trigger, opened by send button */}
      {enableRefinement && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="hidden" />
          <DialogContent className="sm:max-w-md bg-muted border-border">
            <DialogTitle className="text-lg font-semibold text-center text-white">
              Choose a message vibe
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Select how you want your message to sound
            </DialogDescription>
            
            <div className="space-y-4 mt-2">
              {/* Original message display */}
              <div className="p-3 bg-black/70 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm text-white">{message}</p>
              </div>
              
              {/* Show refined message preview if available */}
              {refinedMessage && selectedVibe && (
                <div className="p-3 bg-black/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">With {selectedVibe.name} vibe:</p>
                  <p className="text-sm text-white">{refinedMessage}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {/* Initial top vibes */}
                {topVibes.map((vibe) => (
                  <VibePill
                    key={vibe.id}
                    vibe={vibe}
                    isSelected={selectedVibe?.id === vibe.id}
                    onClick={handleVibeClick}
                  />
                ))}
                
                {/* More vibes (expandable) */}
                {expandedVibes && moreVibes.map((vibe) => (
                  <VibePill
                    key={vibe.id}
                    vibe={vibe}
                    isSelected={selectedVibe?.id === vibe.id}
                    onClick={handleVibeClick}
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
              
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default"
                  className="hwf-button"
                  onClick={() => {
                    sendMessage();
                    setDialogOpen(false);
                  }}
                  disabled={isSending || isRefining}
                >
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Input */}
      <div className="flex items-end">
        <div className="flex-1 mr-2 relative">
          {enableRefinement && selectedVibe && (
            <div 
              className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: selectedVibe.color, color: 'black' }}
            >
              {selectedVibe.name}
            </div>
          )}
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
          onClick={prepareToSend}
          disabled={isSending || isRefining || !message.trim()}
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
