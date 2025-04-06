import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Coaching() {
  const { user } = useAuth();

  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <Link href="/">
            <span className="mr-4 text-muted-foreground hover:text-white cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </span>
          </Link>
          <h2 className="text-xl font-semibold text-white">Relationship Coaching</h2>
        </div>
        
        {/* Empty coaching page - blank canvas */}
        <div className="flex items-center justify-center p-12">
          <div className="bg-muted rounded-2xl border border-border p-6 text-center w-full">
            <p className="text-muted-foreground">Coaching page - blank canvas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
