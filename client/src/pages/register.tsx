import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Heart } from "lucide-react";

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
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span className="text-rose-500">Spousey</span>.ai
            <Heart className="h-6 w-6 text-rose-400" />
          </h1>
          <p className="text-gray-500 mt-2">Create your account to get started</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Doe"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="johnsmith"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-xl transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
