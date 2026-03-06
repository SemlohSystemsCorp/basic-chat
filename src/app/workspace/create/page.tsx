"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Video } from "lucide-react";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Workspace name must be at least 2 characters");
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

    const slug = generateSlug(name) + "-" + Math.random().toString(36).slice(2, 7);

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

    // Create default #general channel
    await supabase.from("channels").insert({
      workspace_id: workspace.id,
      name: "general",
      description: "General discussion",
      is_default: true,
      created_by: user.id,
    });

    // Create #random channel
    await supabase.from("channels").insert({
      workspace_id: workspace.id,
      name: "random",
      description: "Random stuff",
      created_by: user.id,
    });

    router.push(`/workspace/${workspace.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Video className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Workspaces are where your team communicates. Set one up to get
            started.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              This is the name of your company, team, or project.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? "Creating..." : "Create workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
