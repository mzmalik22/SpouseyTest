import { useEffect, useState, FormEvent } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingSession, CoachingSessionMessage } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
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
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions"] });
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
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { sessionId: number; content: string; isUserMessage: boolean }) => {
      const response = await apiRequest("POST", "/api/coaching/sessions/messages", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions", sessionId] });
      setNewMessage("");
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
    
    createSessionMutation.mutate({ title: sessionTitle });
    setNewSessionOpen(false);
    setSessionTitle("");
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
  
  // Simple coach response generator (this would be replaced with OpenAI in a production app)
  const generateCoachResponse = (userMessage: string): string => {
    const responses = [
      "I understand how you feel. Could you tell me more about that?",
      "That's an interesting perspective. How does this affect your relationship?",
      "I appreciate you sharing that. What do you think would help in this situation?",
      "It sounds like this is important to you. How has your partner responded?",
      "Thank you for your honesty. Have you discussed this with your partner?",
      "I'm here to support you. What outcome are you hoping for?",
      "That must be challenging. How have you been coping with this?"
    ];
    
    // In a real app, this would use AI to generate a contextual response
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // If viewing a specific session
  if (sessionId && !sessionLoading && sessionData) {
    return (
      <div className="h-full min-h-screen flex flex-col bg-black">
        <Navbar />
        
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Link href="/coaching-sessions">
              <a className="mr-4 text-muted-foreground hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
            <h2 className="text-xl font-semibold text-white">
              {sessionData.session.title}
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
                    sessionData.session.status === 'active' 
                      ? 'bg-green-900/20 text-green-500' 
                      : sessionData.session.status === 'completed'
                        ? 'bg-blue-900/20 text-blue-500'
                        : 'bg-gray-900/20 text-gray-500'
                  }`}>
                    {sessionData.session.status && sessionData.session.status.charAt(0).toUpperCase() + sessionData.session.status.slice(1) || 'Active'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Created:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-white">
                    {new Date(sessionData.session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Last Activity:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-white">
                    {formatDistanceToNow(new Date(sessionData.session.lastMessageAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted rounded-2xl border border-border p-6">
            <h3 className="text-lg font-medium text-white mb-4">Conversation</h3>
            
            {sessionData.messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start a conversation to get coaching.
              </div>
            ) : (
              <div className="space-y-4">
                {sessionData.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3/4 rounded-2xl px-4 py-2 ${
                      message.isUserMessage 
                        ? 'bg-emotion-passionate text-white' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
            <Link href="/coaching">
              <a className="mr-4 text-muted-foreground hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
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
                      {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
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
                        {session.status && session.status.charAt(0).toUpperCase() + session.status.slice(1) || 'Active'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full text-white border-border hover:bg-background"
                      onClick={() => setLocation(`/coaching-sessions/${session.id}`)}
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