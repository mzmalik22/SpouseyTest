import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import MessageBubble from "@/components/message-bubble";
import MessageComposer from "@/components/message-composer";
import { Message } from "@/lib/types";

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
                  <button 
                    onClick={() => {
                      const starterEvent = new CustomEvent('set-message', { 
                        detail: { message: "Miss you today 💭" } 
                      });
                      window.dispatchEvent(starterEvent);
                    }}
                    className="text-xs bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-border/50"
                  >
                    Miss you today 💭
                  </button>
                  <button 
                    onClick={() => {
                      const starterEvent = new CustomEvent('set-message', { 
                        detail: { message: "Dinner tonight? ❤️" } 
                      });
                      window.dispatchEvent(starterEvent);
                    }}
                    className="text-xs bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-border/50"
                  >
                    Dinner tonight? ❤️
                  </button>
                  <button 
                    onClick={() => {
                      const starterEvent = new CustomEvent('set-message', { 
                        detail: { message: "How's your day going?" } 
                      });
                      window.dispatchEvent(starterEvent);
                    }}
                    className="text-xs bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-border/50"
                  >
                    How's your day going?
                  </button>
                  <button 
                    onClick={() => {
                      const starterEvent = new CustomEvent('set-message', { 
                        detail: { message: "Can't wait to see you! 😊" } 
                      });
                      window.dispatchEvent(starterEvent);
                    }}
                    className="text-xs bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-border/50"
                  >
                    Can't wait to see you! 😊
                  </button>
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
