"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Shield, User } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Navbar } from "~/components/navbar";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        bio: bio || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Profile updated.");
      setTimeout(() => setSuccess(""), 3000);
    }
    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    }
    setPasswordSaving(false);
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="animate-pulse h-64 rounded-lg border border-border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Settings
        </h1>

        {/* Quick links */}
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          <Link
            href="/settings/billing"
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Billing</p>
              <p className="text-xs text-muted-foreground">
                Manage your subscription
              </p>
            </div>
          </Link>
          <Link
            href="/checkout"
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Upgrade plan
              </p>
              <p className="text-xs text-muted-foreground">
                See available plans
              </p>
            </div>
          </Link>
        </div>

        {/* Profile section */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {displayName || username}
              </p>
              <p className="text-sm text-muted-foreground">@{username}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                placeholder="How you want to be known"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </div>

        {/* Password section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Change password
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>

            <Button type="submit" variant="outline" disabled={passwordSaving}>
              {passwordSaving ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
