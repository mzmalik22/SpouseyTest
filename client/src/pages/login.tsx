import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import spouseyLogo from "@/assets/spousey-logo.png";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
    } catch (error) {
      console.error("Login failed:", error);
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
            <p className="text-muted-foreground mt-2">Strengthen your relationship through better communication</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="Enter your email address"
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

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="border-muted-foreground data-[state=checked]:bg-emotion-happy data-[state=checked]:border-emotion-happy"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground">Remember me</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="text-sm">
                  <a href="#" className="font-medium text-emotion-peaceful hover:text-white">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="hwf-button"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Continue"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/register" className="font-medium text-emotion-happy hover:text-white">
                    Sign up
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
        <h2 className="text-3xl font-bold text-white mb-4">Communicate better with your partner</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Spousey.ai uses AI to help you express your feelings in the most effective way, strengthening your relationship one message at a time.
        </p>
        <ul className="space-y-4">
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-happy flex items-center justify-center text-black">✓</div>
            AI-powered message refinement
          </li>
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-peaceful flex items-center justify-center text-black">✓</div>
            Relationship coaching
          </li>
          <li className="flex items-center text-muted-foreground">
            <div className="mr-3 w-6 h-6 rounded-full bg-emotion-sad flex items-center justify-center text-black">✓</div>
            Partner connection tools
          </li>
        </ul>
      </div>
    </div>
  );
}
