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
  const { data: messages, isLoading } = useQuery({
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
    <div className="h-full min-h-screen flex flex-col bg-neutral-50">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 text-neutral-500 hover:text-neutral-800">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
          <h2 className="text-xl font-semibold text-neutral-800">Messages with {getPartnerName()}</h2>
        </div>
        
        {/* Messages List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map((message: Message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                No messages yet. Start a conversation!
              </div>
            )}
          </div>
          
          {/* Message Composer */}
          <MessageComposer onMessageSent={handleMessageSent} />
        </div>
      </div>
    </div>
  );
}
