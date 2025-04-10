import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import spouseyLogo from "@/assets/spousey-logo-transparent.png";
import { birthSexValues } from "@shared/schema";

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthSex: z.enum(birthSexValues, {
    required_error: "Please select your birth sex",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [location] = useLocation();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  
  // Extract invite code from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const code = searchParams.get('inviteCode');
    if (code) {
      setInviteCode(code);
      console.log("Found invite code in URL:", code);
    }
  }, [location]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      birthSex: undefined,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      // Pass the invite code to the register function if available
      await register(values, inviteCode || undefined);
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
              
              <FormField
                control={form.control}
                name="birthSex"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-white">Birth Sex</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-2"
                        disabled={isLoading}
                      >
                        {birthSexValues.map((sex) => (
                          <div key={sex} className="flex-1 flex items-center justify-center space-x-1 p-1 border border-border rounded-md hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={sex} id={sex} />
                            <Label htmlFor={sex} className="cursor-pointer capitalize text-white text-sm">
                              {sex}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
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
        <h2 className="text-3xl font-bold text-white mb-4">Join Spousey Today</h2>
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
