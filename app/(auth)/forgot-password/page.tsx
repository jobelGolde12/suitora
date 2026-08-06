"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/utils/validation";
import { requestPasswordResetAction } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await requestPasswordResetAction(data);

      if (result.success) {
        setMessage({
          type: "success",
          text: "If an account exists for that email, we've sent a password reset link.",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Unable to send a reset link. Please try again." });
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
        <h1 className="font-heading text-3xl font-light tracking-tight">Forgot password?</h1>
        <p className="mt-3 text-sm text-muted font-light">
          Enter your email and we&apos;ll send you reset instructions.
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

        <Button type="submit" loading={isLoading} variant="editorial" className="w-full rounded-full h-12">
          Send Reset Link
          <ChevronRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted font-light">
        Remembered your password?{" "}
        <Link href="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
