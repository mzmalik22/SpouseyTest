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
    <div className="h-full min-h-screen flex flex-col bg-neutral-50">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Partner Connection Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-semibold text-neutral-800">Partner Connection</h2>
                {user?.partnerId ? (
                  <p className="text-neutral-500 mt-1">
                    You're connected with your partner
                  </p>
                ) : (
                  <p className="text-neutral-500 mt-1">
                    Invite your partner to start your journey together
                  </p>
                )}
              </div>
              
              {!user?.partnerId && (
                <div>
                  <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
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
              icon={<MessageSquare className="h-6 w-6 text-primary" />}
              title="Messages"
              description="Communicate with your partner in a thoughtful way"
              linkText="Open"
              linkUrl="/messages"
              iconBgColor="bg-primary-light"
              linkBgColor="bg-primary-light"
              linkTextColor="text-primary"
            />
            
            <QuickAccessTile 
              icon={<BookOpen className="h-6 w-6 text-rose-500" />}
              title="Coaching"
              description="Get personalized advice to strengthen your relationship"
              linkText="Open"
              linkUrl="/coaching"
              iconBgColor="bg-rose-200"
              linkBgColor="bg-rose-100"
              linkTextColor="text-rose-500"
            />
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">Recent Activity</h2>
            
            {activitiesLoading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : activities && activities.length > 0 ? (
              activities.map((activity: any) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500">
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
