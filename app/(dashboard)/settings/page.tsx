"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Palette,
  Bell,
  CreditCard,
  LogOut,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { PageContainer, PageHeader, fadeInUp } from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";

type SettingsTab = "profile" | "password" | "appearance" | "subscription";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      // Notify other tabs
      if (typeof window !== "undefined") {
        localStorage.setItem("session_update", Date.now().toString());
      }
      router.push("/login");
    } catch {
      addToast("Failed to sign out", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    addToast("Settings saved successfully", "success");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div
            key="profile"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Avatar initials="JD" size="xl" />
              <div>
                <Button variant="editorial" size="sm" className="rounded-full">
                  Change Photo
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2 font-light">
                  JPG, PNG or WEBP. 1:1 ratio recommended.
                </p>
              </div>
            </div>
            <Input label="Full Name" defaultValue="John Doe" />
            <Input label="Email" type="email" defaultValue="john@example.com" />
            <Button
              onClick={handleSave}
              loading={isSaving}
              variant="editorial"
              className="rounded-full px-6"
            >
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Save Changes
            </Button>
          </motion.div>
        );

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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              )}
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </nav>

        <div className="min-h-[400px]">
          <Card>
            <CardContent className="pt-2">{renderContent()}</CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
