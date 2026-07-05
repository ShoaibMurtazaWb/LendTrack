"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader, PageSkeleton } from "@/components/page-layout";
import { useProfile, useUpdateProfile } from "@/hooks/useAuth";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [emailReminders, setEmailReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmailReminders(profile.notification_prefs?.email_reminders ?? true);
      setWeeklyDigest(profile.notification_prefs?.weekly_digest ?? false);
    }
  }, [profile]);

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName.trim() });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const saveNotifications = async (prefs: {
    email_reminders: boolean;
    weekly_digest: boolean;
  }) => {
    try {
      await updateProfile.mutateAsync({ notification_prefs: prefs });
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader title="Settings" description="Manage your account and preferences" />

        {isLoading ? (
          <PageSkeleton />
        ) : (
          <div className="mx-auto max-w-lg space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your display name and account email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Display name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled className="bg-muted" />
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
                <Button onClick={saveProfile} disabled={updateProfile.isPending}>
                  Save profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose which emails you receive from LendTrack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    onCheckedChange={(checked) => {
                      setEmailReminders(checked);
                      saveNotifications({ email_reminders: checked, weekly_digest: weeklyDigest });
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-digest">Weekly digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Summary of active and overdue loans (Premium)
                    </p>
                  </div>
                  <Switch
                    id="weekly-digest"
                    checked={weeklyDigest}
                    disabled={profile?.plan !== "premium"}
                    onCheckedChange={(checked) => {
                      setWeeklyDigest(checked);
                      saveNotifications({ email_reminders: emailReminders, weekly_digest: checked });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-colors hover:border-primary/40">
              <Link href="/settings/billing" className="block">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <CreditCard className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Billing & plans</CardTitle>
                      <CardDescription>Compare plans and manage subscription</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardHeader>
              </Link>
            </Card>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
