import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, inviteCode?: string) => Promise<void>;
  register: (userData: any, inviteCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is already logged in
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/auth/current-user");
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, inviteCode?: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid email or password");
      }
      
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.firstName || userData.username || userData.email}!`,
      });
      
      // Handle invite code if present
      if (inviteCode && userData.id) {
        try {
          const acceptResponse = await apiRequest("POST", "/api/users/accept-invite", { 
            inviteCode 
          });
          
          if (acceptResponse.ok) {
            toast({
              title: "Partner Connected",
              description: "You've been successfully connected with your partner!",
            });
            
            // Refresh user data to get the updated partner connection
            await refreshUser();
          }
        } catch (acceptError) {
          console.error("Error accepting invitation after login:", acceptError);
          // Don't throw since login was successful
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any, inviteCode?: string) => {
    try {
      setLoading(true);
      
      // Include invite code in the registration data if provided
      const registerData = inviteCode ? { ...userData, inviteCode } : userData;
      
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not create account");
      }
      
      const newUser = await response.json();
      setUser(newUser);
      toast({
        title: "Registration Successful",
        description: `Welcome to Spousey, ${newUser.firstName || newUser.email}!`,
      });
      
      // If there was an invite code, we attempt to accept it automatically
      if (inviteCode && newUser.id) {
        try {
          const acceptResponse = await apiRequest("POST", "/api/users/accept-invite", { 
            inviteCode 
          });
          
          if (acceptResponse.ok) {
            toast({
              title: "Partner Connected",
              description: "You've been successfully connected with your partner!",
            });
            
            // Refresh user data to get the updated partner connection
            await refreshUser();
          }
        } catch (acceptError) {
          console.error("Error accepting invitation after registration:", acceptError);
          // We don't throw here since registration was successful
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account",
      });
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/auth/logout", {});
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not log out");
      }
      
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error instanceof Error ? error.message : "Could not log out",
      });
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
