import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import spouseyLogo from "@/assets/spousey-logo.png";

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await register(values);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center gap-2">
              <img src={spouseyLogo} alt="Spousey" className="h-20 w-auto mb-2" />
              <h1 className="text-3xl font-bold text-white">Spousey</h1>
            </div>
            <p className="text-muted-foreground mt-2">Create your account to get started</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          className="w-full p-4 bg-muted border border-border text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-emotion-angry" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          className="w-full p-4 bg-muted border border-border text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-emotion-angry" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="johnsmith"
                        className="w-full p-4 bg-muted border border-border text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-emotion-angry" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
                        className="w-full p-4 bg-muted border border-border text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-emotion-angry" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="w-full p-4 bg-muted border border-border text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-emotion-angry" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="hwf-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Continue"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-emotion-happy hover:text-white">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-muted to-black p-12 flex flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <div className="grid grid-cols-2 gap-6">
            <div className="emotion-circle emotion-circle-happy w-16 h-16 flex items-center justify-center">
              <span className="text-2xl">😊</span>
            </div>
            <div className="emotion-circle emotion-circle-peaceful w-16 h-16 flex items-center justify-center">
              <span className="text-2xl">💚</span>
            </div>
            <div className="emotion-circle emotion-circle-sad w-16 h-16 flex items-center justify-center">
              <span className="text-2xl">💙</span>
            </div>
            <div className="emotion-circle emotion-circle-angry w-16 h-16 flex items-center justify-center">
              <span className="text-2xl">❤️</span>
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Join Spousey.ai Today</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Start your journey to better communication and a stronger relationship. Create your account to access all features.
        </p>
        <ul className="space-y-4">
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-happy flex items-center justify-center text-black">✓</div>
            Partner connection
          </li>
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-peaceful flex items-center justify-center text-black">✓</div>
            Message vibe refinement
          </li>
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-sad flex items-center justify-center text-black">✓</div>
            Relationship progress tracking
          </li>
        </ul>
      </div>
    </div>
  );
}
