import { useEffect, useRef, useState, FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

// UI components
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Heart, 
  List as ListIcon, 
  MessageCircle, 
  Plus, 
  User, 
  UserPlus2 
} from "lucide-react";

// Types from schema
import { CoachingSession, CoachingTopic } from "@shared/schema";

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
  const sessionId = params.id || null;
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
      setNewSessionOpen(false);
      setSessionTitle("");
      
      // Invalidate the query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions"] });
      
      // Navigate to the new session
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
      setTimeout(scrollToBottom, 100);
    }
  }, [sessionData?.messages]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { sessionId: string; content: string; isUserMessage: boolean }) => {
      const response = await apiRequest("POST", `/api/coaching/sessions/${data.sessionId}/messages`, {
        content: data.content,
        isUserMessage: data.isUserMessage
      });
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refresh messages
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions", sessionId] });
      setNewMessage("");
      
      // After a short delay, refresh again to get the AI response
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions", sessionId] });
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Message mutation error:", error);
    }
  });
  
  // Handle creating new session
  const handleCreateSession = (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    // Generate a default title based on the current time
    const defaultTitle = `Coaching session - ${new Date().toLocaleDateString()}`;
    
    // Create the session
    createSessionMutation.mutate({ title: sessionTitle.trim() || defaultTitle });
  };
  
  // Handle sending message
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId) return;
    
    const loadingMessage = newMessage;
    setNewMessage("");
    
    // Send user message
    sendMessageMutation.mutate({
      sessionId,
      content: loadingMessage,
      isUserMessage: true
    });
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
  
  // If viewing a specific session
  if (sessionId && sessionData && sessionData.session) {
    return (
      <div className="h-full min-h-screen flex flex-col bg-black">
        <Navbar />
        
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
          {/* Session header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
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
          </div>
          
          {/* Session info card */}
          <div className="bg-muted rounded-lg border border-border p-3 mb-4 text-sm">
            <div className="flex flex-wrap gap-4 items-center">
              {sessionData.topic && (
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-1">Topic:</span>
                  <span className="text-white">{sessionData.topic.title}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
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
              
              <div className="flex items-center">
                <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground mr-1">Created:</span>
                <span className="text-white">
                  {sessionData.session?.createdAt ? new Date(sessionData.session.createdAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                <span className="text-muted-foreground mr-1">Last activity:</span>
                <span className="text-white">
                  {sessionData.session?.lastMessageAt 
                    ? formatDistanceToNow(new Date(sessionData.session.lastMessageAt), { addSuffix: true })
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Chat container */}
          <div className="bg-muted rounded-lg border border-border p-4 flex-1 flex flex-col">
            <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-4 bg-background border border-border/30 rounded-lg p-4 min-h-[400px]">
              {!sessionData.messages || sessionData.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                  <UserPlus2 className="h-12 w-12 mb-4 text-muted-foreground/60" />
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm max-w-sm">Start a conversation to get relationship coaching from your AI therapist.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Welcome message */}
                  <div className="flex justify-start mb-6">
                    <div className="flex items-start max-w-[75%]">
                      <div className="bg-emotion-peaceful/20 border border-emotion-peaceful/30 rounded-lg px-4 py-3 text-white">
                        <p className="font-medium mb-1">Welcome to your coaching session</p>
                        <p>Hi there! I'm your relationship coach. I'm here to listen and provide guidance based on your needs. Feel free to share what's on your mind about your relationship, and we can work through it together.</p>
                      </div>
                    </div>
                  </div>

                  {/* Conversation messages */}
                  {sessionData.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                      {!message.isUserMessage && (
                        <div className="h-8 w-8 rounded-full bg-emotion-peaceful/30 flex items-center justify-center mr-2 mt-1">
                          <Heart className="h-4 w-4 text-emotion-peaceful" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-lg px-4 py-3 ${
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
                  
                  {/* Typing indicator */}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="h-8 w-8 rounded-full bg-emotion-peaceful/30 flex items-center justify-center mr-2">
                        <Heart className="h-4 w-4 text-emotion-peaceful" />
                      </div>
                      <div className="bg-gray-700 text-white rounded-lg px-4 py-2 rounded-tl-none">
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
            
            {/* Message input */}
            <div>
              <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message to the AI therapist..."
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
                        setLocation(`/coaching-sessions/${session.id}`);
                        
                        // Also invalidate the query to ensure fresh data
                        queryClient.invalidateQueries({ 
                          queryKey: ["/api/coaching/sessions", String(session.id)] 
                        });
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
            <DialogTitle>New Coaching Session</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Begin your conversation with a relationship coach
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
                  <div className="flex items-center justify-center">
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-current" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Start Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}