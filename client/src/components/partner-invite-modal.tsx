import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";

interface PartnerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerInviteModal({ isOpen, onClose }: PartnerInviteModalProps) {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [inviteCode, setInviteCode] = useState<string>(user?.inviteCode || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInviteCode = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      // Generate a new invite code if none exists
      if (!inviteCode) {
        const newCode = Math.random().toString(36).substring(2, 10);
        const response = await apiRequest("POST", "/api/users/invite", { inviteCode: newCode });
        const data = await response.json();
        setInviteCode(data.inviteCode);
        await refreshUser();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite code",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "The invitation link has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-muted border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Invite Your Partner</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate a unique link to invite your partner to join you on Spousey.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted-foreground/10 rounded-xl p-4 mb-4 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Your personal invitation link:</p>
          <div className="flex">
            <Input
              value={inviteCode ? `${window.location.origin}/invite/${inviteCode}` : "Generate an invitation link"}
              readOnly
              className="flex-1 bg-black/40 p-2 text-sm border border-border text-white rounded-l-lg focus:ring-2 focus:ring-emotion-happy focus:outline-none"
            />
            {inviteCode ? (
              <Button
                onClick={copyInviteLink}
                className="bg-emotion-happy text-black px-3 py-2 rounded-r-lg hover:bg-emotion-happy/90"
              >
                <Copy className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={generateInviteCode}
                className="bg-emotion-happy text-black px-3 py-2 rounded-r-lg hover:bg-emotion-happy/90"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            )}
          </div>
        </div>

        {inviteCode && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Share this unique link with your partner to connect on Spousey.
            </p>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-emotion-happy hover:bg-emotion-happy/90 text-black font-medium rounded-xl transition duration-200"
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
