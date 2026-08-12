"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginFormData } from "@/lib/utils/validation";
import { loginAction } from "@/lib/auth/actions";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await loginAction(data);

      if (result.success) {
        setMessage({ type: "success", text: "Welcome back! Redirecting..." });
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        setMessage({ type: "error", text: result.error || "Invalid email or password." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setMessage(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setMessage({ type: "error", text: "Google sign-in failed. Please try again." });
      setIsGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-light tracking-tight">Welcome back</h1>
        <p className="mt-3 text-sm text-muted font-light">
          Sign in to your Suitora account
        </p>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-6"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-error/10 text-error border border-error/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="hello@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-muted hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-sm text-muted font-light">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted hover:text-accent transition-colors font-light"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isLoading} variant="editorial" className="w-full rounded-full h-12">
          Sign In
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted font-light">or continue with</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <Button
        type="button"
        onClick={handleGoogleSignIn}
        loading={isGoogleLoading}
        disabled
        variant="secondary"
        className="w-full rounded-full mt-4 h-12 cursor-not-allowed disabled:opacity-60"
      >
        <Globe className="h-5 w-5" />
        Sign in with Google
      </Button>

      <p className="mt-8 text-center text-sm text-muted font-light">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign up
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted font-light">
        <Link
          href="/privacy-policy"
          className="hover:text-accent transition-colors"
        >
          Privacy Policy
        </Link>
      </p>
    </motion.div>
  );
}
