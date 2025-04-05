import { useState } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import QuickAccessTile from "@/components/quick-access-tile";
import ActivityItem from "@/components/activity-item";
import PartnerInviteModal from "@/components/partner-invite-modal";
import { MessageSquare, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Partner Connection Status */}
          <div className="bg-muted rounded-2xl border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-semibold text-white">Partner Connection</h2>
                {user?.partnerId ? (
                  <p className="text-muted-foreground mt-1">
                    You're connected with your partner
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    Invite your partner to start your journey together
                  </p>
                )}
              </div>
              
              {!user?.partnerId && (
                <div>
                  <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="hwf-button w-auto px-4 py-2 flex items-center"
                  >
                    <i className="fas fa-user-plus mr-2"></i> Invite Partner
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Access Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <QuickAccessTile 
              icon={<MessageSquare className="h-6 w-6 text-emotion-happy" />}
              title="Messages"
              description="Communicate with your partner in a thoughtful way"
              linkText="Open"
              linkUrl="/messages"
              iconBgColor="bg-muted"
              linkBgColor="bg-emotion-happy"
              linkTextColor="text-black"
            />
            
            <QuickAccessTile 
              icon={<BookOpen className="h-6 w-6 text-emotion-peaceful" />}
              title="Coaching"
              description="Get personalized advice to strengthen your relationship"
              linkText="Open"
              linkUrl="/coaching"
              iconBgColor="bg-muted"
              linkBgColor="bg-emotion-peaceful"
              linkTextColor="text-black"
            />
          </div>
          
          {/* Recent Activity */}
          <div className="bg-muted rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            
            {activitiesLoading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emotion-happy"></div>
              </div>
            ) : activities && activities.length > 0 ? (
              activities.map((activity: any) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No recent activity to display
              </div>
            )}
          </div>
        </div>
      </div>
      
      <PartnerInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
