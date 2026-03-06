"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Monitor, Moon, Sun } from "lucide-react";

const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("user_preferences")
        .select("theme")
        .eq("user_id", user.id)
        .single();

      if (data?.theme) {
        setTheme(data.theme);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSuccess("Appearance saved.");
    setTimeout(() => setSuccess(""), 3000);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse h-48 rounded border border-border bg-card" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how Module looks for you.
        </p>
      </div>

      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="rounded border border-border bg-card p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Theme</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select your preferred theme.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 rounded border p-4 transition-colors ${
                    theme === value
                      ? "border-primary bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </div>
    </div>
  );
}
