"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Video,
  Globe,
  Check,
  X,
  Loader2,
  Hash,
  Mail,
} from "lucide-react";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [defaultChannels, setDefaultChannels] = useState("general, random");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      }
    }
    checkAuth();
  }, [supabase, router]);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  // Auto-generate slug from name (unless manually edited)
  useEffect(() => {
    if (!slugManual && name) {
      const newSlug = generateSlug(name);
      setSlug(newSlug);
    }
  }, [name, slugManual]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      setSlugAvailable(!data);
      setCheckingSlug(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, supabase]);

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40)
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Workspace name must be at least 2 characters");
      return;
    }
    if (slug.length < 2) {
      setError("URL must be at least 2 characters");
      return;
    }
    if (slugAvailable === false) {
      setError("That URL is already taken");
      return;
    }

    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), slug, owner_id: user.id })
      .select()
      .single();

    if (wsError || !workspace) {
      setError(wsError?.message || "Failed to create workspace");
      setCreating(false);
      return;
    }

    // Add creator as owner member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    // Create channels
    const channelNames = defaultChannels
      .split(",")
      .map((c) =>
        c
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, "")
      )
      .filter(Boolean);

    for (let i = 0; i < channelNames.length; i++) {
      await supabase.from("channels").insert({
        workspace_id: workspace.id,
        name: channelNames[i],
        description: i === 0 ? "General discussion" : undefined,
        is_default: i === 0,
        created_by: user.id,
      });
    }

    // Send invites (just store emails for now — could send via Resend)
    const emails = inviteEmails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (emails.length > 0) {
      // TODO: Send invite emails via /api/invite endpoint
      console.log("Invite emails:", emails);
    }

    router.push(`/workspace/${workspace.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-lg px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Video className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1
              ? "Set up your workspace name and URL."
              : "Customize your workspace."}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-16 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded border border-border bg-card p-6 space-y-5">
              {/* Workspace name */}
              <div className="space-y-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Corp, My Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Subdomain/slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Workspace URL
                </Label>
                <div className="flex items-center gap-0">
                  <div className="flex h-10 items-center rounded-l border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                    https://
                  </div>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="your-team"
                    className="flex h-10 flex-1 border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors font-mono"
                  />
                  <div className="flex h-10 items-center rounded-r border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                    .georgeholmes.io
                  </div>
                </div>
                <div className="flex items-center gap-1.5 h-4">
                  {checkingSlug && slug.length >= 2 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking...
                    </span>
                  )}
                  {!checkingSlug && slugAvailable === true && slug.length >= 2 && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      Available
                    </span>
                  )}
                  {!checkingSlug && slugAvailable === false && slug.length >= 2 && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <X className="h-3 w-3" />
                      Already taken
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subdomain preview */}
            {slug && slug.length >= 2 && slugAvailable !== false && (
              <div className="rounded border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">
                    Your workspace will be available at:
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-mono text-primary ml-6">
                  {slug}.georgeholmes.io
                </p>
              </div>
            )}

            <Button
              onClick={() => {
                setError("");
                if (name.trim().length < 2) {
                  setError("Workspace name must be at least 2 characters");
                  return;
                }
                if (slug.length < 2) {
                  setError("URL must be at least 2 characters");
                  return;
                }
                if (slugAvailable === false) {
                  setError("That URL is already taken");
                  return;
                }
                setStep(2);
              }}
              className="w-full"
              disabled={!name.trim() || slug.length < 2 || slugAvailable === false || checkingSlug}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="rounded border border-border bg-card p-6 space-y-5">
              {/* Default channels */}
              <div className="space-y-2">
                <Label htmlFor="channels" className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Channels
                </Label>
                <Input
                  id="channels"
                  value={defaultChannels}
                  onChange={(e) => setDefaultChannels(e.target.value)}
                  placeholder="general, random, announcements"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of channels to create. The first one will
                  be the default.
                </p>
              </div>

              {/* Invite members */}
              <div className="space-y-2">
                <Label htmlFor="invites" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Invite people
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <textarea
                  id="invites"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder={"colleague@company.com\nfriend@example.com"}
                  rows={3}
                  className="flex w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  One email per line or comma-separated. You can invite more
                  later.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Summary
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL</span>
                  <span className="font-mono text-primary text-xs">
                    {slug}.georgeholmes.io
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channels</span>
                  <span className="text-foreground">
                    {defaultChannels
                      .split(",")
                      .filter((c) => c.trim())
                      .length}
                  </span>
                </div>
                {inviteEmails.trim() && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invites</span>
                    <span className="text-foreground">
                      {
                        inviteEmails
                          .split(/[,\n]/)
                          .filter((e) => e.trim().includes("@")).length
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create workspace"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            You can always change your workspace name and URL later in settings.
          </p>
        )}
      </div>
    </div>
  );
}
