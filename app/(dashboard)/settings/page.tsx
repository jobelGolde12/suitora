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
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";

type SettingsTab = "profile" | "password" | "appearance" | "subscription";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SettingsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
                <Button variant="secondary" size="sm">
                  Change Photo
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">
                  JPG, PNG or WEBP. 1:1 ratio recommended.
                </p>
              </div>
            </div>
            <Input label="Full Name" defaultValue="John Doe" />
            <Input label="Email" type="email" defaultValue="john@example.com" />
            <Button onClick={handleSave} loading={isSaving}>
              <Check className="h-4 w-4" />
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
            <Button onClick={handleSave} loading={isSaving}>
              <Check className="h-4 w-4" />
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
            className="space-y-4"
          >
            <p className="text-sm text-muted">Choose your preferred theme</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsDarkMode(false)}
                className={cn(
                  "rounded-2xl border-2 p-6 text-center transition-all duration-200",
                  !isDarkMode
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted"
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-white border border-border mx-auto mb-3 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-sm font-medium">Light Mode</p>
                <p className="text-[10px] text-muted-foreground mt-1">Clean and bright</p>
              </button>
              <button
                onClick={() => setIsDarkMode(true)}
                className={cn(
                  "rounded-2xl border-2 p-6 text-center transition-all duration-200",
                  isDarkMode
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted"
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-foreground border border-border mx-auto mb-3 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-background" />
                </div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-[10px] text-muted-foreground mt-1">Easy on the eyes</p>
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive analysis updates and tips</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-6 rounded-full bg-surface border border-border peer peer-checked:bg-primary peer-checked:border-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <Button onClick={handleSave} loading={isSaving}>
              <Check className="h-4 w-4" />
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
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted mt-1">per month</p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Up to 10 analyses per month",
                    "Basic compatibility scores",
                    "Save up to 5 favorites",
                    "7-day history retention",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Button variant="secondary" className="w-full" disabled>
              Current Plan
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted mt-1">
            Manage your account preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          {/* Sidebar Tabs */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            <div className="pt-4 mt-4 border-t border-border">
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-all">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="min-h-[400px]">
            <Card>
              <CardContent className="pt-6">{renderContent()}</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
