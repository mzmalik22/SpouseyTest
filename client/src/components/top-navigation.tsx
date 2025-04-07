import { Link } from "wouter";
import { MessageSquare, BookOpen, Calendar, UserCog, Home } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function TopNavigation() {
  const { user } = useAuth();
  
  return (
    <div className="hidden md:block w-full bg-muted py-2 border-b border-border mb-6">
      <div className="container mx-auto">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="font-semibold text-lg text-white flex items-center">
              <span className="text-xl mr-2">👋</span>
              Spousey
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center px-4 py-2 hover:bg-black/30 rounded-md">
              <Home className="w-5 h-5 mr-2 text-white" />
              <span className="text-white">Home</span>
            </Link>
            
            <Link href="/messages" className="flex items-center px-4 py-2 hover:bg-black/30 rounded-md">
              <MessageSquare className="w-5 h-5 mr-2 text-emotion-happy" />
              <span className="text-white">Messages</span>
            </Link>
            
            <Link href="/calendar" className="flex items-center px-4 py-2 hover:bg-black/30 rounded-md">
              <Calendar className="w-5 h-5 mr-2 text-emotion-calm" />
              <span className="text-white">Calendar</span>
            </Link>
            
            <Link href="/coaching" className="flex items-center px-4 py-2 hover:bg-black/30 rounded-md">
              <BookOpen className="w-5 h-5 mr-2 text-emotion-peaceful" />
              <span className="text-white">Coaching</span>
            </Link>
            
            {user?.seesTherapist && (
              <Link href="/therapist" className="flex items-center px-4 py-2 hover:bg-black/30 rounded-md">
                <UserCog className="w-5 h-5 mr-2 text-emotion-passionate" />
                <span className="text-white">Therapist</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}