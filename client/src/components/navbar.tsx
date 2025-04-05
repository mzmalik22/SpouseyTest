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
import { MessageSquare } from "lucide-react";
import spouseyLogo from "@/assets/spousey-logo-transparent.png";

export default function Navbar() {
  const { user, logout } = useAuth();

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
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src={spouseyLogo} alt="Spousey" className="h-10 w-auto" />
                <span className="text-xl font-bold text-white">Spousey</span>
              </div>
            </Link>
          </div>

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
                  <Link href="/coaching-sessions" className="cursor-pointer w-full text-white">
                    Coaching Sessions
                  </Link>
                </DropdownMenuItem>
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
