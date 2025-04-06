import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  EditIcon, 
  FilePlus, 
  SendIcon, 
  Settings, 
  Trash2,
  XIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { SessionCategory } from "@shared/schema";

// Define interfaces for our data
interface CoachingSession {
  id: number;
  title: string;
  userId: number;
  category: SessionCategory;
  createdAt: string;
  updatedAt: string;
}

interface SessionMessage {
  id: number;
  sessionId: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export default function Coaching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Extract session ID from URL if present (e.g., /coaching?session=123)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionIdParam = urlParams.get('session');
  
  const [activeSessionId, setActiveSessionId] = useState<number | null>(
    sessionIdParam ? parseInt(sessionIdParam) : null
  );
  const [newMessage, setNewMessage] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionCategory, setNewSessionCategory] = useState<SessionCategory>('general');
  const [editingSession, setEditingSession] = useState<CoachingSession | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch all user sessions
  const { 
    data: sessions = [], 
    isLoading: isLoadingSessions,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['/api/coaching/sessions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaching/sessions');
      return await response.json();
    },
    select: (data) => {
      // Sort sessions by updatedAt descending
      return [...data].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  });
  
  // Fetch session messages when activeSessionId changes
  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['/api/coaching/sessions', activeSessionId, 'messages'],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const response = await apiRequest('GET', `/api/coaching/sessions/${activeSessionId}/messages`);
      return await response.json();
    },
    enabled: !!activeSessionId,
  });
  
  // Fetch active session details
  const { 
    data: activeSession,
    isLoading: isLoadingActiveSession
  } = useQuery({
    queryKey: ['/api/coaching/sessions', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;
      const response = await apiRequest('GET', `/api/coaching/sessions/${activeSessionId}`);
      return await response.json();
    },
    enabled: !!activeSessionId,
  });
  
  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: { title: string, category: SessionCategory }) => {
      const response = await apiRequest('POST', '/api/coaching/sessions', sessionData);
      return await response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions'] });
      setActiveSessionId(newSession.id);
      setNewSessionTitle('');
      setNewSessionCategory('general');
      setIsCreatingSession(false);
      
      // Update URL with session ID
      const newUrl = `/coaching?session=${newSession.id}`;
      window.history.pushState({}, '', newUrl);
      
      toast({
        title: "Session created",
        description: "Your new coaching session has been created."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CoachingSession> }) => {
      const response = await apiRequest('PATCH', `/api/coaching/sessions/${id}`, data);
      return await response.json();
    },
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions', updatedSession.id] });
      setEditingSession(null);
      
      toast({
        title: "Session updated",
        description: "Your coaching session has been updated."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('DELETE', `/api/coaching/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions'] });
      
      // If the deleted session was active, clear the active session
      if (activeSessionId === deletedSessionId) {
        setActiveSessionId(null);
        window.history.pushState({}, '', '/coaching');
      }
      
      toast({
        title: "Session deleted",
        description: "Your coaching session has been deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: number, content: string }) => {
      const response = await apiRequest('POST', `/api/coaching/sessions/${sessionId}/messages`, {
        content,
        role: 'user'
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions', activeSessionId, 'messages'] });
      setNewMessage('');
      
      // Get AI response
      getAIResponseMutation.mutate({
        sessionId: activeSessionId!,
        messageHistory: [...messages, { role: 'user', content: newMessage }]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Get AI response mutation
  const getAIResponseMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      messageHistory 
    }: { 
      sessionId: number, 
      messageHistory: { role: string, content: string }[] 
    }) => {
      const response = await apiRequest('POST', '/api/coaching/ai-response', {
        sessionId,
        messageHistory
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions', activeSessionId, 'messages'] });
      // Also update the sessions list as the timestamp will have changed
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error getting AI response",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Update session list to reflect changes from server
  useEffect(() => {
    if (activeSessionId && sessions && sessions.length > 0) {
      // If the active session exists in the sessions list, update URL
      const sessionExists = sessions.some(session => session.id === activeSessionId);
      if (sessionExists && sessionIdParam !== activeSessionId.toString()) {
        const newUrl = `/coaching?session=${activeSessionId}`;
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [activeSessionId, sessions, sessionIdParam]);
  
  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeSessionId) {
      toast({
        title: "No active session",
        description: "Please select or create a session first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newMessage.trim()) {
      return;
    }
    
    sendMessageMutation.mutate({
      sessionId: activeSessionId,
      content: newMessage.trim()
    });
  };
  
  // Handle pressing Enter to send message (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };
  
  // Handle creating a new session
  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) {
      toast({
        title: "Session title required",
        description: "Please enter a title for your coaching session.",
        variant: "destructive"
      });
      return;
    }
    
    createSessionMutation.mutate({
      title: newSessionTitle.trim(),
      category: newSessionCategory
    });
  };
  
  // Handle updating a session
  const handleUpdateSession = () => {
    if (!editingSession) return;
    
    updateSessionMutation.mutate({
      id: editingSession.id,
      data: {
        title: editingSession.title,
        category: editingSession.category
      }
    });
  };
  
  // Handle session selection
  const handleSelectSession = (sessionId: number) => {
    setActiveSessionId(sessionId);
    setIsSheetOpen(false);
    
    // Update URL
    const newUrl = `/coaching?session=${sessionId}`;
    window.history.pushState({}, '', newUrl);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render loading state
  if (isLoadingSessions) {
    return (
      <div className="h-full min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Get welcome message for a new chat
  const getWelcomeMessage = (category: SessionCategory) => {
    switch (category) {
      case 'relationship':
        return "Hello! I'm your relationship coach. I'm here to help you navigate your relationship journey. What specific aspect of your relationship would you like to discuss today?";
      case 'communication':
        return "Welcome to your communication coaching session. Effective communication is key to a healthy relationship. What communication challenges are you facing that I can help with?";
      case 'conflict':
        return "I'm here to help you with conflict resolution. Conflicts are normal in relationships, but how we handle them makes all the difference. What's been happening that you'd like to address?";
      case 'intimacy':
        return "Welcome to your intimacy coaching session. Intimacy comes in many forms - emotional, physical, intellectual. What aspects of intimacy in your relationship would you like to explore?";
      case 'future':
        return "Let's talk about your relationship goals and future plans. Having aligned visions helps couples grow together. What future aspects of your relationship are on your mind?";
      default:
        return "Hi there! I'm your relationship coach. I'm here to support you with any relationship questions or challenges. What would you like to talk about today?";
    }
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile session selector */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/">
              <span className="mr-4 text-muted-foreground hover:text-white cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </span>
            </Link>
            <h2 className="text-xl font-semibold text-white truncate">
              {activeSession ? activeSession.title : "Relationship Coaching"}
            </h2>
          </div>
          
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="px-2">
                <ChevronDown className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-950 border-gray-800 text-white w-[90%] sm:w-[350px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white">Coaching Sessions</SheetTitle>
              </SheetHeader>
              
              {renderSessionsList()}
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-[300px] flex-shrink-0 flex-col border-r border-gray-800 pr-4 mr-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <span className="text-muted-foreground hover:text-white cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </span>
            </Link>
            <h2 className="text-xl font-semibold text-white">Coaching</h2>
            <div className="w-5"></div> {/* Spacer to balance the back button */}
          </div>
          
          {renderSessionsList()}
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-140px)]">
          {activeSessionId ? (
            <>
              {/* Chat header */}
              <div className="hidden md:flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  {activeSession?.title || "Loading..."}
                </h3>
                
                {activeSession && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-950 border-gray-800 text-white">
                      <DropdownMenuItem onClick={() => setEditingSession(activeSession)} className="cursor-pointer">
                        <EditIcon className="mr-2 h-4 w-4" />
                        <span>Edit Session</span>
                      </DropdownMenuItem>
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Session</span>
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-950 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>Delete Coaching Session</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p>Are you sure you want to delete this coaching session? This action cannot be undone.</p>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive" 
                              onClick={() => deleteSessionMutation.mutate(activeSessionId)}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Messages area */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4 pb-4">
                  {/* If there are no messages, show welcome message */}
                  {messages.length === 0 && activeSession && (
                    <div className="flex gap-3 text-gray-300">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-white">AI</span>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 max-w-[80%]">
                        <p className="whitespace-pre-wrap">{getWelcomeMessage(activeSession.category)}</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {message.role !== 'user' && (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold text-white">AI</span>
                        </div>
                      )}
                      
                      <div 
                        className={`rounded-lg p-4 max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-gray-900 text-gray-300'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs mt-2 opacity-70 text-right">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold">{user?.nickname?.[0] || user?.firstName?.[0] || 'U'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Show typing indicator when AI is generating a response */}
                  {getAIResponseMutation.isPending && (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-white">AI</span>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full rounded-lg bg-gray-900 border-gray-800 focus:border-primary resize-none min-h-[60px] pr-12 text-white"
                  disabled={sendMessageMutation.isPending || getAIResponseMutation.isPending}
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 bottom-2 text-primary"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending || getAIResponseMutation.isPending}
                >
                  <SendIcon className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold mb-2">Welcome to Relationship Coaching</h3>
                <p className="text-muted-foreground mb-6">
                  Start a new session or select one from the list to begin chatting with your relationship coach.
                </p>
                <Button
                  onClick={() => setIsCreatingSession(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Start a New Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* New session dialog */}
      <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Coaching Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="e.g., Communication Issues, Trust Building"
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newSessionCategory}
                onValueChange={(value) => setNewSessionCategory(value as SessionCategory)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="relationship">Relationship</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="conflict">Conflict Resolution</SelectItem>
                  <SelectItem value="intimacy">Intimacy</SelectItem>
                  <SelectItem value="future">Future Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession}>
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit session dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => {
        if (!open) setEditingSession(null);
      }}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Coaching Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Session Title</Label>
                <Input
                  id="edit-title"
                  value={editingSession.title}
                  onChange={(e) => setEditingSession({...editingSession, title: e.target.value})}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingSession.category}
                  onValueChange={(value) => setEditingSession({...editingSession, category: value as SessionCategory})}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="relationship">Relationship</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="conflict">Conflict Resolution</SelectItem>
                    <SelectItem value="intimacy">Intimacy</SelectItem>
                    <SelectItem value="future">Future Planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Helper function to render the sessions list
  function renderSessionsList() {
    return (
      <>
        <Button
          onClick={() => setIsCreatingSession(true)}
          className="w-full mb-6"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          New Coaching Session
        </Button>
        
        {sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            No coaching sessions yet
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-gray-900 text-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span className="capitalize">{session.category}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(session.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }
}
