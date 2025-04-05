import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Facebook, Mail, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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

  const shareViaEmail = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    const subject = "Join me on Spousey.ai";
    const body = `I'd like to connect with you on Spousey.ai, a relationship wellness app. Join me using this link: ${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaWhatsApp = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    const text = `I'd like to connect with you on Spousey.ai, a relationship wellness app. Join me using this link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const shareViaMessenger = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=123456789`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-800">Invite Your Partner</DialogTitle>
          <DialogDescription className="text-neutral-500">
            Generate a unique link to invite your partner to join you on Spousey.ai.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-neutral-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-neutral-500 mb-2">Your personal invitation link:</p>
          <div className="flex">
            <Input
              value={inviteCode ? `${window.location.origin}/invite/${inviteCode}` : "Generate an invitation link"}
              readOnly
              className="flex-1 bg-white p-2 text-sm border border-neutral-200 rounded-l-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {inviteCode ? (
              <Button
                onClick={copyInviteLink}
                className="bg-primary text-white px-3 py-2 rounded-r-lg hover:bg-primary-dark"
              >
                <Copy className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={generateInviteCode}
                className="bg-primary text-white px-3 py-2 rounded-r-lg hover:bg-primary-dark"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            )}
          </div>
        </div>

        {inviteCode && (
          <div className="mb-6">
            <h4 className="font-medium text-neutral-800 mb-2">Share via:</h4>
            <div className="flex space-x-3">
              <Button
                onClick={shareViaMessenger}
                variant="outline"
                className="flex-1 gap-2 text-blue-600 hover:text-blue-700 border-neutral-200"
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-xs">Messenger</span>
              </Button>

              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="flex-1 gap-2 text-green-600 hover:text-green-700 border-neutral-200"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-xs">WhatsApp</span>
              </Button>

              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="flex-1 gap-2 text-neutral-800 hover:text-neutral-900 border-neutral-200"
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-xs">Email</span>
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition duration-200"
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
