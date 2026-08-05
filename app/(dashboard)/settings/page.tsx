"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Palette,
  Bell,
  CreditCard,
  LogOut,
  Check,
  Ruler,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/components/providers/SessionProvider";
import { PageContainer, PageHeader, fadeInUp } from "@/components/dashboard";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { cn } from "@/lib/utils/cn";

type SettingsTab = "profile" | "measurements" | "password" | "appearance" | "subscription";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "measurements", label: "Body Data", icon: Ruler },
  { id: "password", label: "Password", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const { logout } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setShowConfirmModal(false);

    try {
      const success = await logout();
      if (!success) {
        addToast("Signed out locally, but server logout failed", "warning");
      }
    } catch {
      addToast("An error occurred during logout", "error");
    } finally {
      setIsLoggingOut(false);
      window.location.href = "/login";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    addToast("Settings saved successfully", "success");
  };

  const handleDownloadData = () => {
    window.location.href = "/api/user/data";
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setShowDeleteModal(false);

    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await logout();
    } catch {
      addToast("Failed to delete account. Please try again.", "error");
      setIsDeleting(false);
      return;
    }

    window.location.href = "/";
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileForm />;

      case "password":
        return (
          <motion.div
            key="password"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-4"
          >
            <Input label="Current Password" type="password" placeholder="Enter current password" />
            <Input label="New Password" type="password" placeholder="Enter new password" />
            <Input label="Confirm New Password" type="password" placeholder="Confirm new password" />
            <Button
              onClick={handleSave}
              loading={isSaving}
              variant="editorial"
              className="rounded-full px-6"
            >
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Update Password
            </Button>
          </motion.div>
        );

      case "appearance":
        return (
          <motion.div
            key="appearance"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-5"
          >
            <p className="text-sm text-muted font-light">Choose your preferred theme</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsDarkMode(false)}
                className={cn(
                  "rounded-2xl border p-6 text-center transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !isDarkMode
                    ? "border-foreground/30 bg-surface"
                    : "border-border hover:border-muted"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-white border border-border mx-auto mb-3 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium">Light Mode</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-light">Clean and bright</p>
              </button>
              <button
                type="button"
                onClick={() => setIsDarkMode(true)}
                className={cn(
                  "rounded-2xl border p-6 text-center transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isDarkMode
                    ? "border-foreground/30 bg-surface"
                    : "border-border hover:border-muted"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-foreground border border-border mx-auto mb-3 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-background" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-light">Easy on the eyes</p>
              </button>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground font-light">
                    Receive analysis updates and tips
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-6 rounded-full bg-card border border-border peer peer-checked:bg-foreground peer-checked:border-foreground transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <Button
              onClick={handleSave}
              loading={isSaving}
              variant="editorial"
              className="rounded-full px-6"
            >
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Save Preferences
            </Button>
          </motion.div>
        );

      case "subscription":
        return (
          <motion.div
            key="subscription"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-5"
          >
            <Card className="!p-0 border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Free Plan</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="font-heading text-4xl font-light tracking-tight">$0</p>
                <p className="text-sm text-muted mt-1 font-light">per month</p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Up to 10 analyses per month",
                    "Basic compatibility scores",
                    "Save up to 5 favorites",
                    "7-day history retention",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-muted font-light">
                      <Check className="h-4 w-4 text-success flex-shrink-0" strokeWidth={1.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Button variant="secondary" className="w-full rounded-full" disabled>
              Current Plan
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <PageContainer narrow>
      <PageHeader
        label="Account"
        title="Settings"
        description="Manage your account preferences and subscription."
      />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 lg:gap-10">
        <nav className="space-y-1" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === tab.id
                    ? "bg-surface text-foreground"
                    : "text-muted hover:text-foreground hover:bg-surface/70"
                )}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <Icon
                  className={cn("h-4 w-4", activeTab === tab.id && "text-accent")}
                  strokeWidth={1.5}
                />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </nav>

        <div className="min-h-[400px]">
          <Card>
            <CardContent className="pt-2">{renderContent()}</CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-error/20 bg-error/5 p-6">
          <div>
            <h3 className="font-heading text-lg font-medium tracking-tight text-error">
              Danger Zone
            </h3>
            <p className="text-sm text-muted font-light mt-1 leading-relaxed">
              Download a copy of your data or permanently delete your account
              and all associated photos, analyses, and favorites.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              variant="secondary"
              onClick={handleDownloadData}
              className="rounded-full"
            >
              <Download className="h-4 w-4" strokeWidth={1.5} />
              Download my data
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              Delete account
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign out"
        description="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isLoggingOut}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete account"
        description="This permanently deletes your account, photos, analyses, favorites, and all associated data. This action cannot be undone."
        confirmLabel="Delete my account"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
