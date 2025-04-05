import { useEffect, useState, FormEvent, useRef } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Plus, Calendar, Clock, Heart, User, UserPlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingSession, CoachingSessionMessage } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SessionResponse {
  session: CoachingSession;
  messages: any[];
  topic?: {
    id: number;
    title: string;
    description: string;
    icon: string;
  } | null;
}

export default function CoachingSessions() {
  const { user } = useAuth();
  const params = useParams();
  const sessionId = params.id ? parseInt(params.id) : null;
  const [location, setLocation] = useLocation();
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch all coaching sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<CoachingSession[]>({
    queryKey: ["/api/coaching/sessions"],
    enabled: !!user,
  });
  
  // Fetch specific session when selected
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/coaching/sessions", sessionId],
    enabled: !!sessionId,
  });
  
  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await apiRequest("POST", "/api/coaching/sessions", data);
      return await response.json();
    },
    onSuccess: (data: CoachingSession) => {
      // Close the modal dialog
      setNewSessionOpen(false);
      setSessionTitle("");
      
      // Invalidate the query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions"] });
      
      // Navigate using setLocation (wouter) instead of direct window.location change
      setLocation(`/coaching-sessions/${data.id}`);
      
      toast({
        title: "Session created",
        description: "Your coaching session has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create coaching session. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Function to scroll to the bottom of the message container
  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };
  
  // Effect to scroll to bottom when messages change or when session data loads
  useEffect(() => {
    if (sessionData?.messages?.length) {
      // Small delay to ensure DOM has updated
      setTimeout(scrollToBottom, 100);
    }
  }, [sessionData?.messages]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { sessionId: number; content: string; isUserMessage: boolean }) => {
      const response = await apiRequest("POST", "/api/coaching/sessions/messages", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions", sessionId] });
      setNewMessage("");
      // Scroll to bottom after sending a message (will happen via the useEffect when data updates)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Handle creating new session
  const handleCreateSession = (e: FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) {
      toast({
        title: "Please enter a title",
        description: "Session title cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Create the session and let onSuccess handle the redirection
    createSessionMutation.mutate({ title: sessionTitle });
    // Don't need to set these here as they'll be redundant
    // The navigation will happen in the onSuccess callback
  };
  
  // Handle sending message
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;
    
    // Send user message
    sendMessageMutation.mutate({
      sessionId,
      content: newMessage,
      isUserMessage: true
    });
    
    // Auto-generate coach response after a short delay
    setTimeout(() => {
      if (sessionId) {
        sendMessageMutation.mutate({
          sessionId,
          content: generateCoachResponse(newMessage),
          isUserMessage: false
        });
      }
    }, 1500);
  };
  
  // Enhanced coach response generator that provides more contextual responses
  const generateCoachResponse = (userMessage: string): string => {
    // Context-aware responses based on common relationship themes
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for specific themes in the message
    if (lowerMessage.includes("communication") || lowerMessage.includes("talk") || lowerMessage.includes("understand")) {
      return "Communication seems to be a key concern. What specific communication challenges are you facing with your partner? Sometimes writing down your thoughts before discussing them can help you express yourself more clearly.";
    }
    
    if (lowerMessage.includes("trust") || lowerMessage.includes("cheat") || lowerMessage.includes("lie")) {
      return "Trust is a fundamental element in relationships. Can you tell me more about what's happened that's affected trust between you? Building trust often takes time and consistent actions.";
    }
    
    if (lowerMessage.includes("anger") || lowerMessage.includes("fight") || lowerMessage.includes("argue") || lowerMessage.includes("mad")) {
      return "Conflict is normal in relationships, but how we handle it matters. When you feel anger rising, try taking a brief pause or using 'I feel' statements instead of accusations. What typically triggers these arguments?";
    }
    
    if (lowerMessage.includes("time") || lowerMessage.includes("busy") || lowerMessage.includes("attention")) {
      return "Quality time is one of the key love languages. Have you discussed with your partner what your expectations are for time together? Sometimes scheduling regular date nights can help prioritize your relationship.";
    }
    
    if (lowerMessage.includes("sex") || lowerMessage.includes("intimate") || lowerMessage.includes("physical")) {
      return "Physical intimacy is an important aspect of many relationships. Have you been able to have an open conversation with your partner about your needs and expectations? Sometimes these conversations are difficult but necessary.";
    }
    
    if (lowerMessage.includes("family") || lowerMessage.includes("parent") || lowerMessage.includes("child") || lowerMessage.includes("kid")) {
      return "Family dynamics can add complexity to relationships. How do you and your partner navigate family boundaries? It's often helpful to present a unified approach when dealing with extended family matters.";
    }
    
    if (lowerMessage.includes("money") || lowerMessage.includes("finance") || lowerMessage.includes("spend")) {
      return "Financial disagreements are common in relationships. Have you and your partner discussed your financial values and goals? Creating a shared budget that includes both joint expenses and personal spending money can help reduce tension.";
    }
    
    if (lowerMessage.includes("appreciate") || lowerMessage.includes("thank") || lowerMessage.includes("love")) {
      return "Expressing appreciation is a powerful way to strengthen your relationship. Consider starting a gratitude practice where you share one thing you appreciate about each other daily. What do you value most about your partner?";
    }
    
    // Default responses for when no specific theme is detected
    const defaultResponses = [
      "I understand how you feel. Could you tell me more about that? The more details you share, the better I can help you navigate this situation.",
      "That's an interesting perspective. How does this affect your day-to-day relationship? Sometimes patterns emerge that we don't initially recognize.",
      "Thank you for sharing that with me. What do you think would be a first step toward improving this situation? Sometimes small changes can make a big difference.",
      "It sounds like this is important to you. How has your partner responded when you've expressed these feelings? Understanding both perspectives can be helpful.",
      "I appreciate your honesty. Have you discussed these feelings directly with your partner? Sometimes our partners aren't aware of how their actions affect us.",
      "I'm here to support you through this. What outcome are you hoping for in this situation? Having a clear goal can help guide our conversation.",
      "That must be challenging. How have you been taking care of yourself while dealing with this? Self-care is essential during relationship stress."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };
  
  // Show loading indicator while fetching session data
  if (sessionId && sessionLoading) {
    return (
      <div className="h-full min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emotion-peaceful"></div>
        </div>
      </div>
    );
  }
  
  // If viewing a specific session and data is loaded
  if (sessionId && sessionData && sessionData.session) {
    return (
      <div className="h-full min-h-screen flex flex-col bg-black">
        <Navbar />
        
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => setLocation('/coaching-sessions')}
              className="mr-4 text-muted-foreground hover:text-white"
            >
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {sessionData.session?.title || "Coaching Session"}
            </h2>
          </div>
          
          <div className="bg-muted rounded-2xl border border-border p-6 mb-6">
            <div className="flex flex-col space-y-4">
              {sessionData.topic && (
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">Related Topic:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-white font-medium">{sessionData.topic.title}</span>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    sessionData.session?.status === 'active' 
                      ? 'bg-green-900/20 text-green-500' 
                      : sessionData.session?.status === 'completed'
                        ? 'bg-blue-900/20 text-blue-500'
                        : 'bg-gray-900/20 text-gray-500'
                  }`}>
                    {sessionData.session?.status 
                      ? `${sessionData.session.status.charAt(0).toUpperCase()}${sessionData.session.status.slice(1)}` 
                      : 'Active'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Created:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-white">
                    {sessionData.session?.createdAt ? new Date(sessionData.session.createdAt).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Last Activity:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-white">
                    {sessionData.session?.lastMessageAt 
                      ? formatDistanceToNow(new Date(sessionData.session.lastMessageAt), { addSuffix: true })
                      : 'No activity yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted rounded-2xl border border-border p-6">
            <h3 className="text-lg font-medium text-white mb-4">Conversation</h3>
            
            <div ref={messageContainerRef} className="h-[400px] overflow-y-auto mb-4 bg-background border border-border/30 rounded-lg p-4">
              {!sessionData.messages || sessionData.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                  <UserPlus2 className="h-12 w-12 mb-4 text-muted-foreground/60" />
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm max-w-sm">Start a conversation to get relationship coaching from your AI therapist.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Welcome message always shown at the start of a session */}
                  <div className="flex justify-start mb-6">
                    <div className="flex items-start max-w-[75%]">
                      <div className="bg-emotion-peaceful/20 border border-emotion-peaceful/30 rounded-2xl px-4 py-3 text-white">
                        <p className="font-medium mb-1">Welcome to your coaching session</p>
                        <p>Hi there! I'm your relationship coach. I'm here to listen and provide guidance based on your needs. Feel free to share what's on your mind about your relationship, and we can work through it together.</p>
                      </div>
                    </div>
                  </div>

                  {/* Actual conversation messages */}
                  {sessionData.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                      {!message.isUserMessage && (
                        <div className="h-8 w-8 rounded-full bg-emotion-peaceful/30 flex items-center justify-center mr-2 mt-1">
                          <Heart className="h-4 w-4 text-emotion-peaceful" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.isUserMessage 
                          ? 'bg-emotion-passionate text-white rounded-tr-none' 
                          : 'bg-gray-700 text-white rounded-tl-none'
                      }`}>
                        {message.content}
                        <div className={`text-xs mt-1 ${message.isUserMessage ? 'text-white/70 text-right' : 'text-white/70'}`}>
                          {message.createdAt 
                            ? format(new Date(message.createdAt), 'h:mm a')
                            : format(new Date(), 'h:mm a')}
                        </div>
                      </div>
                      {message.isUserMessage && (
                        <div className="h-8 w-8 rounded-full bg-emotion-passionate/30 flex items-center justify-center ml-2 mt-1">
                          <User className="h-4 w-4 text-emotion-passionate" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing indicator when message is being sent */}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="h-8 w-8 rounded-full bg-emotion-peaceful/30 flex items-center justify-center mr-2">
                        <Heart className="h-4 w-4 text-emotion-peaceful" />
                      </div>
                      <div className="bg-gray-700 text-white rounded-2xl px-4 py-2 rounded-tl-none">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          <div className="h-2 w-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 rounded-lg bg-background px-4 py-2 text-white border border-border focus:outline-none focus:ring-2 focus:ring-emotion-peaceful"
                />
                <Button 
                  type="submit" 
                  variant="default" 
                  size="icon" 
                  className="bg-emotion-peaceful hover:bg-emotion-peaceful/90"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-current" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // List view of all sessions
  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => setLocation('/')}
              className="mr-4 text-muted-foreground hover:text-white"
            >
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">Coaching Sessions</h2>
          </div>
          
          <Button 
            className="bg-emotion-peaceful hover:bg-emotion-peaceful/90"
            onClick={() => setNewSessionOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Session
          </Button>
        </div>
        
        {/* Loading State */}
        {sessionsLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emotion-peaceful"></div>
          </div>
        )}
        
        {/* Sessions List */}
        {!sessionsLoading && sessions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground mb-4">You don't have any coaching sessions yet.</p>
                <Button 
                  className="bg-emotion-peaceful hover:bg-emotion-peaceful/90"
                  onClick={() => setNewSessionOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Start Your First Session
                </Button>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="bg-muted border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">{session.title}</CardTitle>
                    <CardDescription>
                      {session.lastMessageAt 
                        ? formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })
                        : 'Created recently'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'active' 
                          ? 'bg-green-900/20 text-green-500' 
                          : session.status === 'completed'
                            ? 'bg-blue-900/20 text-blue-500'
                            : 'bg-gray-900/20 text-gray-500'
                      }`}>
                        {session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Active'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full text-white border-border hover:bg-background"
                      onClick={() => {
                        // Force re-fetch the session data when redirecting
                        queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions", session.id] });
                        // Use the router's navigation instead of window.location
                        setLocation(`/coaching-sessions/${session.id}`);
                      }}
                    >
                      Continue Session
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* New Session Dialog */}
      <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
        <DialogContent className="bg-muted border-border text-white">
          <DialogHeader>
            <DialogTitle>Start a New Coaching Session</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Begin your conversation with a relationship coach. What would you like to discuss today?
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSession}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Session Title
                </label>
                <input 
                  id="title"
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Communication issues, Trust building, etc."
                  className="w-full rounded-md bg-background border border-border p-2 text-white"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                className="border-border text-white"
                onClick={() => setNewSessionOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-emotion-peaceful hover:bg-emotion-peaceful/90"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-current" />
                    Creating...
                  </div>
                ) : (
                  "Start Session"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}