import { useAuth } from "@/context/auth-context";
import { Button } from "./ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import NotificationsDropdown from "./notifications-dropdown";
import NotificationBadge from "./notification-badge";
import { MessageSquare, BookOpen, Calendar, UserCog, Home } from "lucide-react";
import spouseyLogo from "@/assets/spousey-logo-transparent.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativePlatform } from "@/lib/capacitor";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const isNative = isNativePlatform();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-muted/50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo section */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src={spouseyLogo} alt="Spousey" className="h-10 w-auto" />
                <span className="text-xl font-bold text-white">Spousey</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation links - only show on large screens and non-native */}
          {!isMobile && !isNative && (
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-muted-foreground/10 flex items-center">
                <Home className="w-4 h-4 mr-1" />
                <span>Home</span>
              </Link>
              <Link href="/messages" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-muted-foreground/10 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1 text-emotion-happy" />
                <span>Messages</span>
              </Link>
              <Link href="/calendar" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-muted-foreground/10 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-emotion-calm" />
                <span>Calendar</span>
              </Link>
              <Link href="/coaching" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-muted-foreground/10 flex items-center">
                <BookOpen className="w-4 h-4 mr-1 text-emotion-peaceful" />
                <span>Coaching</span>
              </Link>
              {user?.seesTherapist && (
                <Link href="/therapist" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-muted-foreground/10 flex items-center">
                  <UserCog className="w-4 h-4 mr-1 text-emotion-passionate" />
                  <span>Therapist</span>
                </Link>
              )}
            </div>
          )}

          {/* User actions section */}
          <div className="flex items-center space-x-2">
            {/* Messages with unread count */}
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-muted-foreground/10">
                <MessageSquare size={20} />
                <span className="absolute -top-1 -right-1">
                  <NotificationBadge endpoint="/api/messages/unread-count" />
                </span>
              </Button>
            </Link>
            
            {/* Notifications dropdown */}
            <NotificationsDropdown />
            
            {/* User profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 focus:ring-0 text-white hover:bg-muted-foreground/10">
                  {user?.firstName && <span className="text-sm hidden sm:inline">{user.firstName}</span>}
                  <Avatar className="h-8 w-8 border border-emotion-happy">
                    <AvatarFallback className="bg-emotion-happy text-black">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted border border-border">
                <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild className="focus:bg-muted-foreground/10">
                  <Link href="/" className="cursor-pointer w-full text-white">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-muted-foreground/10">
                  <Link href="/messages" className="cursor-pointer w-full text-white">
                    Messages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-muted-foreground/10">
                  <Link href="/coaching" className="cursor-pointer w-full text-white">
                    Coaching
                  </Link>
                </DropdownMenuItem>
                {user?.seesTherapist && (
                  <DropdownMenuItem asChild className="focus:bg-muted-foreground/10">
                    <Link href="/therapist" className="cursor-pointer w-full text-white">
                      Therapist
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-emotion-angry focus:text-emotion-angry focus:bg-muted-foreground/10">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
