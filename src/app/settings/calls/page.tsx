"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export default function CallsSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [micOnJoin, setMicOnJoin] = useState(true);
  const [camOnJoin, setCamOnJoin] = useState(true);

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
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setMicOnJoin(data.mic_on_join ?? true);
        setCamOnJoin(data.cam_on_join ?? true);
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
        mic_on_join: micOnJoin,
        cam_on_join: camOnJoin,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSuccess("Call preferences saved.");
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
        <h2 className="text-lg font-semibold text-foreground">Calls</h2>
        <p className="text-sm text-muted-foreground">
          Configure your default call settings.
        </p>
      </div>

      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="rounded border border-border bg-card p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Microphone on join</Label>
              <p className="text-xs text-muted-foreground">
                Automatically enable your microphone when joining a call.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMicOnJoin(!micOnJoin)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                micOnJoin ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  micOnJoin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Camera on join</Label>
              <p className="text-xs text-muted-foreground">
                Automatically enable your camera when joining a call.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCamOnJoin(!camOnJoin)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                camOnJoin ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  camOnJoin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </div>
    </div>
  );
}
