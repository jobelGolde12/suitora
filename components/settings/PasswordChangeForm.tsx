"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { authClient } from "@/lib/auth/client";
import { fadeInUp } from "@/components/dashboard/motion";

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Change the signed-in user's password via Better Auth. Validates locally
 * (current required, new meets policy, confirmation matches) and surfaces
 * server-side errors (wrong current password, weak new password) inline.
 */
export function PasswordChangeForm() {
  const { addToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: PasswordFormErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = "Please enter your current password.";
    }
    if (!newPassword) {
      nextErrors.newPassword = "Please enter a new password.";
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (result?.error) {
        const message = result.error.message || "Failed to change password";
        // Better Auth returns a 401 with "Invalid password" when the current
        // password is wrong — surface that case with clearer copy.
        if (result.error.status === 401 || /invalid password/i.test(message)) {
          setErrors({ currentPassword: "Your current password is incorrect." });
        } else if (/too short|weak|password policy/i.test(message)) {
          setErrors({ newPassword: message });
        } else {
          addToast(message, "error");
        }
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Password updated successfully", "success");
    } catch (err) {
      console.error("Password change failed:", err);
      addToast("Failed to change password. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      key="password"
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Current Password"
        type="password"
        placeholder="Enter current password"
        value={currentPassword}
        onChange={(e) => {
          setCurrentPassword(e.target.value);
          if (errors.currentPassword) {
            setErrors((prev) => ({ ...prev, currentPassword: undefined }));
          }
        }}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <Input
        label="New Password"
        type="password"
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          if (errors.newPassword) {
            setErrors((prev) => ({ ...prev, newPassword: undefined }));
          }
        }}
        error={errors.newPassword}
        autoComplete="new-password"
      />
      <Input
        label="Confirm New Password"
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (errors.confirmPassword) {
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
        }}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          loading={isSaving}
          disabled={isSaving}
          variant="editorial"
          className="rounded-full px-6"
        >
          <Check className="h-4 w-4" strokeWidth={1.5} />
          Update Password
        </Button>
      </div>
    </motion.form>
  );
}
