import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import MessageBubble from "@/components/message-bubble";
import MessageComposer from "@/components/message-composer";
import { Message } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// StarterButton component for conversation starters with confirmation dialog
interface StarterButtonProps {
  message: string;
}

function StarterButton({ message }: StarterButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessage = async () => {
    try {
      setIsSending(true);
      
      const response = await apiRequest("POST", "/api/messages", {
        content: editedMessage,
        originalContent: message !== editedMessage ? message : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Special handling for no partner connected case
        if (errorData.message === "No partner connected") {
          toast({
            title: "Can't send message",
            description: "You need to connect with a partner first. Use the partner invite feature to connect.",
            variant: "destructive",
          });
          setDialogOpen(false);
          return;
        }
        throw new Error(errorData.message || "Failed to send message");
      }
      
      // Invalidate messages cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      setDialogOpen(false);
      setEditedMessage(message); // Reset to original
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

  // Set edited message back to original when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setEditedMessage(message);
    }
  }, [dialogOpen, message]);

  return (
    <>
      <button 
        onClick={() => setDialogOpen(true)}
        className="text-xs bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-border/50"
      >
        {message}
      </button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-muted border-border">
          <DialogTitle className="text-lg font-semibold text-center text-white">
            Send message
          </DialogTitle>
          
          <div className="my-4 space-y-4">
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full p-3 border border-border bg-black/30 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              rows={3}
            />
            
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1 hwf-button flex items-center justify-center gap-2"
                onClick={() => sendMessage()}
                disabled={isSending || !editedMessage.trim()}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleMessageSent = () => {
    // Force a refetch of messages
    queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
  };

  const getPartnerName = () => {
    if (!user?.partnerId) return "your partner";
    return "Alex"; // In a real app, this would come from the partner user object
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 text-muted-foreground hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
          <h2 className="text-xl font-semibold text-white">Messages with {getPartnerName()}</h2>
        </div>
        
        {/* Messages List */}
        <div className="flex-1 bg-muted rounded-2xl border border-border overflow-hidden flex flex-col">
          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ 
            scrollBehavior: "smooth", 
            maxHeight: messages.length > 0 ? "calc(60vh - 150px)" : "auto", 
            minHeight: messages.length > 0 ? "220px" : "150px"
          }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emotion-happy"></div>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-3">
                <div className="bg-black/40 p-3 rounded-xl border border-border/50 max-w-[240px]">
                  <p className="text-muted-foreground text-sm mb-1">No messages yet.</p>
                  <p className="text-xs text-muted-foreground/80">Start a conversation by typing a message below!</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Conversation Starters */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Try a conversation starter:</p>
                <div className="flex flex-wrap gap-2">
                  <StarterButton message="Miss you today 💭" />
                  <StarterButton message="Dinner tonight? ❤️" />
                  <StarterButton message="How's your day going?" />
                  <StarterButton message="Can't wait to see you! 😊" />
                </div>
              </div>
            </div>
          )}
          
          {/* Message Composer */}
          <MessageComposer onMessageSent={handleMessageSent} />
        </div>
      </div>
    </div>
  );
}
