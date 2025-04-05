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
import { Heart } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
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
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.username, values.password);
    } catch (error) {
      console.error("Login failed:", error);
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
          <p className="text-gray-500 mt-2">Strengthen your relationship through better communication</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your username"
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
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-gray-500">Remember me</FormLabel>
                  </FormItem>
                )}
              />

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-xl transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:text-primary-dark">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
