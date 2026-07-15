"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/utils/validation";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    // TODO: Implement actual password reset
    console.log("Forgot password:", data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2 group w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Suitora</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-success" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted">
                We&apos;ve sent a password reset link to your email address.
              </p>
              <Link href="/login">
                <Button variant="secondary" className="mt-4">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
                <p className="mt-2 text-sm text-muted">
                  No worries, we&apos;ll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="hello@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Button type="submit" loading={isLoading} className="w-full">
                  Send Reset Link
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
