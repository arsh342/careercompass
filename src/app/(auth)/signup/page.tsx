"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendWelcomeEmailDirect } from "@/lib/email-utils";
import { AnimatedCharacters } from "@/components/ui/animated-characters";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { toPublicProfile } from "@/lib/public-profile";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["employee", "employer"]).default("employee"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "employee",
    },
  });

  const password = form.watch("password");

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.fullName,
      });

      const role = values.role;

      const nameParts = values.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const userData = {
        uid: user.uid,
        displayName: values.fullName,
        email: values.email,
        role: role,
        firstName: firstName,
        lastName: lastName,
        ...(role === "employer" && { companyName: values.fullName }),
      };

      await setDoc(doc(db, "users", user.uid), userData);
      await setDoc(
        doc(db, "publicProfiles", user.uid),
        toPublicProfile(userData),
      );

      // Send welcome email
      const emailSent = await sendWelcomeEmailDirect(
        values.email,
        values.fullName,
      );

      toast({
        title: "Account Created",
        description:
          "Your account has been successfully created. Please log in.",
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      toast({
        title: "Signup Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden grid lg:grid-cols-2">
      {/* Left Content Section with Animated Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 dark:from-white/90 dark:via-white/80 dark:to-white/70 p-12 text-white dark:text-gray-900">
        <div className="relative z-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Image
              src="https://i.postimg.cc/nLrDYrHW/icon.png"
              alt="CareerCompass logo"
              width={32}
              height={32}
              className="bg-white/10 backdrop-blur-sm p-1 rounded-lg"
            />
            <span>CareerCompass</span>
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={password.length}
          />
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-gray-600 dark:text-gray-700">
          <a
            href="/privacy-policy"
            className="hover:text-gray-900 dark:hover:text-black transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="hover:text-gray-900 dark:hover:text-black transition-colors"
          >
            Terms of Service
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 dark:bg-gray-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 dark:bg-gray-200/20 rounded-full blur-3xl" />
      </div>

      {/* Right Signup Section */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
            <Image
              src="https://i.postimg.cc/nLrDYrHW/icon.png"
              alt="CareerCompass logo"
              width={32}
              height={32}
              className="dark:bg-white dark:p-1 dark:rounded-md"
            />
            <span>CareerCompass</span>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Create an account
            </h1>
            <p className="text-muted-foreground text-sm">
              Join CareerCompass to find your next opportunity
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              <RadioGroup
                defaultValue={form.getValues("role")}
                onValueChange={(val) => form.setValue("role", val as "employee" | "employer")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                  <RadioGroupItem value="employee" id="employee" className="sr-only" />
                  <Label htmlFor="employee" className="cursor-pointer flex-1 font-medium">Job Seeker</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                  <RadioGroupItem value="employer" id="employer" className="sr-only" />
                  <Label htmlFor="employer" className="cursor-pointer flex-1 font-medium">Employer</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name or Company Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe or Acme Inc."
                autoComplete="off"
                {...form.register("fullName")}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="h-12 bg-background border-border/60 focus:border-primary"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                {...form.register("email")}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="h-12 bg-background border-border/60 focus:border-primary"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="privacy-terms" required />
              <Label
                htmlFor="privacy-terms"
                className="text-sm font-normal cursor-pointer"
              >
                I agree to the
                <Link
                  href="/privacy-policy"
                  className="text-primary underline mx-1"
                >
                  Privacy Policy
                </Link>
                and
                <Link href="/terms" className="text-primary underline mx-1">
                  Terms of Service
                </Link>
              </Label>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                {error}
              </div>
            )}

            <InteractiveHoverButton
              type="submit"
              text={isLoading ? "Creating account..." : "Create Account"}
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            />
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
