"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, ChevronRight, Download, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { useLogout, useProfile, useUpdateProfile } from "@/hooks/useAuth";
import { useAuth } from "@/providers/AuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pro-card overflow-hidden">
      <div className="border-b border-outline-variant/30 bg-surface-container-low/50 px-5 py-4 md:px-6">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4 p-5 md:p-6">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const { theme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [emailReminders, setEmailReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmailReminders(profile.notification_prefs?.email_reminders ?? true);
      setWeeklyDigest(profile.notification_prefs?.weekly_digest ?? false);
    }
  }, [profile]);

  const saveProfile = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Please enter your name.");
      return;
    }
    try {
      await updateProfile.mutateAsync({ full_name: trimmed });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const saveNotifications = async (prefs: {
    email_reminders: boolean;
    weekly_digest: boolean;
  }): Promise<boolean> => {
    try {
      await updateProfile.mutateAsync({
        notification_prefs: {
          ...profile?.notification_prefs,
          ...prefs,
        },
      });
      toast.success("Notification preferences saved");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
      return false;
    }
  };

  const handleExportLoans = async () => {
    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");

      const res = await fetch("/api/export/loans", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `lendtrack-loans-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Loan history downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export loans");
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="page-canvas animate-fade-in">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-semibold">Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your account, appearance, and preferences
            </p>
          </div>

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              <SettingsSection title="Profile" description="Your display name and account email">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Display name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-lg border-outline-variant/40 bg-surface-container-low"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled className="rounded-lg bg-surface-container" />
                  <p className="text-xs text-muted-foreground">
                    Email is managed by your login account and cannot be changed here.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="outline" className="capitalize">
                    {profile?.plan ?? "free"}
                  </Badge>
                </div>
                <Button onClick={saveProfile} disabled={updateProfile.isPending} className="rounded-lg">
                  Save profile
                </Button>
              </SettingsSection>

              <SettingsSection title="Appearance" description="Choose light or dark mode for the app">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-xs text-muted-foreground">
                      Currently {theme === "dark" ? "dark" : theme === "light" ? "light" : "system"}
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </SettingsSection>

              <SettingsSection
                title="Notifications"
                description="Choose which emails you receive from LendTrack"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-reminders">Due date reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Email you before items are due and when overdue
                    </p>
                  </div>
                  <Switch
                    id="email-reminders"
                    checked={emailReminders}
                    onCheckedChange={async (checked) => {
                      const prev = emailReminders;
                      setEmailReminders(checked);
                      const ok = await saveNotifications({
                        email_reminders: checked,
                        weekly_digest: weeklyDigest,
                      });
                      if (!ok) setEmailReminders(prev);
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-digest">Weekly digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Monday email summary of active, overdue, and upcoming loans
                    </p>
                    {profile?.plan !== "premium" && (
                      <Link
                        href="/settings/billing"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Upgrade to Premium to enable
                      </Link>
                    )}
                  </div>
                  <Switch
                    id="weekly-digest"
                    checked={weeklyDigest}
                    disabled={profile?.plan !== "premium"}
                    onCheckedChange={async (checked) => {
                      const prev = weeklyDigest;
                      setWeeklyDigest(checked);
                      const ok = await saveNotifications({
                        email_reminders: emailReminders,
                        weekly_digest: checked,
                      });
                      if (!ok) setWeeklyDigest(prev);
                    }}
                  />
                </div>
              </SettingsSection>

              <SettingsSection title="Data export" description="Download your loan history as a CSV file">
                {profile?.plan === "premium" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 rounded-lg"
                    onClick={handleExportLoans}
                    disabled={exporting}
                  >
                    <Download className="size-4" />
                    {exporting ? "Preparing export…" : "Export loan history (CSV)"}
                  </Button>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">CSV export is a Premium feature.</p>
                    <Link
                      href="/settings/billing"
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
                    >
                      View Premium plans
                    </Link>
                  </>
                )}
              </SettingsSection>

              <Link
                href="/settings/billing"
                className="pro-card-hover flex items-center justify-between gap-4 p-5 md:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Billing & plans</p>
                    <p className="text-sm text-muted-foreground">Compare plans and manage subscription</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>

              <SettingsSection title="Account" description="Sign out of LendTrack on this device">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                >
                  <LogOut className="size-4" />
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </Button>
              </SettingsSection>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
