"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginFormData } from "@/lib/utils/validation";
import { loginAction } from "@/lib/auth/actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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
        }, 1000);
      } else {
        setMessage({ type: "error", text: result.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please check your connection and try again." });
    } finally {
      setIsLoading(false);
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
          placeholder="hello@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-muted hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-end">
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

      <p className="mt-8 text-center text-sm text-muted font-light">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
