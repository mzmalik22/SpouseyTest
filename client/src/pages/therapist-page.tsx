import { useState } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { MicIcon, PauseIcon, StopCircleIcon, PlayIcon, FileAudioIcon, User, Users, BookOpen } from "lucide-react";

export default function TherapistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sessions");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [consentProvided, setConsentProvided] = useState(false);
  const [therapyType, setTherapyType] = useState<"individual" | "couple">("individual");
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [notes, setNotes] = useState("");

  // Handle recording start
  const startRecording = () => {
    if (!consentProvided) {
      setConsentDialogOpen(true);
      return;
    }
    
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start timer
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    setTimerInterval(interval);
    
    toast({
      title: "Recording started",
      description: "Your therapy session is now being recorded"
    });
    
    // In a real implementation, we would use the Web Audio API or 
    // Capacitor's microphone plugin to start recording
  };

  // Handle recording stop
  const stopRecording = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    setIsRecording(false);
    
    // Add the new recording to the list
    const newRecording = {
      id: Date.now(),
      date: new Date(),
      duration: recordingTime,
      type: therapyType,
      transcription: null,
      insights: null
    };
    
    setRecordings([newRecording, ...recordings]);
    
    toast({
      title: "Recording saved",
      description: "Your therapy session recording has been saved"
    });
    
    // In a real implementation, we would stop the recording,
    // save the audio file, and start the transcription process
  };

  // Handle providing consent
  const provideConsent = () => {
    setConsentProvided(true);
    setConsentDialogOpen(false);
    
    toast({
      title: "Consent provided",
      description: "Thank you for providing consent. You can now record your therapy sessions."
    });
    
    // Start recording right away after consent is provided
    startRecording();
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-muted rounded-2xl border border-border p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Therapy Assistant</h1>
            <p className="text-muted-foreground mb-6">
              Record and improve your therapy sessions with AI-powered insights and recommendations
            </p>
            
            <Tabs defaultValue="sessions" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6 bg-black">
                <TabsTrigger value="sessions" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <FileAudioIcon className="h-4 w-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="consent" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <Users className="h-4 w-4 mr-2" />
                  Consent
                </TabsTrigger>
                <TabsTrigger value="guide" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Guide
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sessions" className="space-y-4">
                {/* Recording control card */}
                <Card className="bg-black/40 border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Record Therapy Session</CardTitle>
                    <CardDescription>
                      Record your therapy session to receive AI-powered insights and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="therapy-type" 
                            checked={therapyType === "couple"}
                            onCheckedChange={(checked) => setTherapyType(checked ? "couple" : "individual")}
                            disabled={isRecording}
                          />
                          <Label htmlFor="therapy-type">
                            {therapyType === "individual" ? "Individual Therapy" : "Couple Therapy"}
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="text-center">
                          {isRecording ? (
                            <div className="text-2xl font-bold text-emotion-happy animate-pulse">
                              {formatTime(recordingTime)}
                            </div>
                          ) : (
                            <div className="text-lg text-muted-foreground">
                              Ready to record
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-center space-x-4">
                          {!isRecording ? (
                            <Button 
                              onClick={startRecording}
                              className="bg-emotion-happy hover:bg-emotion-happy/80 text-black"
                            >
                              <MicIcon className="h-5 w-5 mr-2" />
                              Start Recording
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopRecording} 
                              variant="destructive"
                            >
                              <StopCircleIcon className="h-5 w-5 mr-2" />
                              Stop Recording
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Session notes */}
                <Card className="bg-black/40 border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Session Notes</CardTitle>
                    <CardDescription>
                      Add any notes about your therapy session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add your session notes here..."
                      className="min-h-[150px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        toast({
                          title: "Notes saved",
                          description: "Your session notes have been saved"
                        });
                      }}
                    >
                      Save Notes
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Previous recordings */}
                <Card className="bg-black/40 border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Previous Sessions</CardTitle>
                    <CardDescription>
                      Access your previously recorded therapy sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recordings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No recordings yet. Record your first therapy session to get started.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recordings.map(recording => (
                          <div 
                            key={recording.id} 
                            className="p-4 bg-black/40 rounded-lg border border-border flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-white">
                                {recording.type === "individual" ? "Individual" : "Couple"} Session
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(recording.date)} • {formatTime(recording.duration)}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <PlayIcon className="h-4 w-4 text-emotion-happy" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="consent" className="space-y-4">
                <Card className="bg-black/40 border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Consent Management</CardTitle>
                    <CardDescription>
                      Manage consent for recording therapy sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-black/40 border border-border rounded-lg">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-emotion-happy/10 rounded-full">
                            <User className="h-6 w-6 text-emotion-happy" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">Individual Therapy Consent</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              To record individual therapy sessions, you need consent from yourself and your therapist.
                            </p>
                            <div className="mt-3">
                              <Button
                                onClick={() => setConsentDialogOpen(true)}
                                className="bg-emotion-happy hover:bg-emotion-happy/80 text-black"
                              >
                                Provide Consent
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-black/40 border border-border rounded-lg">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-emotion-peaceful/10 rounded-full">
                            <Users className="h-6 w-6 text-emotion-peaceful" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">Couple Therapy Consent</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              To record couple therapy sessions, you need consent from yourself, your partner, and your therapist.
                            </p>
                            <div className="mt-3">
                              <Button
                                onClick={() => setConsentDialogOpen(true)}
                                className="bg-emotion-peaceful hover:bg-emotion-peaceful/80 text-black"
                              >
                                Provide Consent
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 border border-border p-4 rounded-lg">
                        <h3 className="font-semibold text-white">Current Consent Status</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Consent for recording therapy sessions
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${consentProvided ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {consentProvided ? 'Provided' : 'Not Provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="guide" className="space-y-4">
                <Card className="bg-black/40 border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Therapy Support Guide</CardTitle>
                    <CardDescription>
                      How to make the most of your therapy sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Before Your Session</h3>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Prepare key topics you want to discuss</li>
                          <li>Reflect on your progress since the last session</li>
                          <li>Identify specific challenges you're facing</li>
                          <li>Consider bringing notes to your session</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">During Your Session</h3>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Be open and honest with your therapist</li>
                          <li>Don't be afraid to ask questions</li>
                          <li>Take notes on key insights or homework</li>
                          <li>With permission, record the session for later reference</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">After Your Session</h3>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Review your notes or recording</li>
                          <li>Complete any homework or exercises</li>
                          <li>Check in with yourself about how you're feeling</li>
                          <li>Track your progress over time</li>
                        </ul>
                      </div>
                      
                      <div className="bg-black/30 p-4 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold text-white mb-2">How Spousey Helps</h3>
                        <p className="text-muted-foreground mb-3">
                          Spousey can enhance your therapy experience by:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Providing AI-powered insights from your session recordings</li>
                          <li>Sending personalized notifications with suggestions between sessions</li>
                          <li>Tracking your progress over time</li>
                          <li>Offering relationship coaching that complements your therapy</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Consent Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="bg-black border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Consent for Recording</DialogTitle>
            <DialogDescription>
              Before recording therapy sessions, we need consent from all participants.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-black/40 border border-border rounded-lg">
              <h3 className="font-semibold text-white mb-2">
                {therapyType === "individual" ? "Individual Therapy Consent" : "Couple Therapy Consent"}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                By providing consent, you acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>All participants have verbally agreed to recording the session</li>
                <li>The recording will be used only for your personal benefit</li>
                <li>The recording will be processed by AI to provide insights</li>
                <li>You can delete recordings at any time</li>
                <li>All data is encrypted and stored securely</li>
              </ul>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="consent-confirmation" checked={consentProvided} onCheckedChange={setConsentProvided} />
              <Label htmlFor="consent-confirmation" className="text-white">
                I confirm all participants have provided consent
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={provideConsent}
              disabled={!consentProvided}
              className="bg-emotion-happy hover:bg-emotion-happy/80 text-black"
            >
              Confirm & Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}