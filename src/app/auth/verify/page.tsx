"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      // Auto-login with stored password
      const storedPassword = sessionStorage.getItem("verify_password");
      if (storedPassword) {
        sessionStorage.removeItem("verify_password");
        await supabase.auth.signInWithPassword({ email, password: storedPassword });
        const checkoutPlan = sessionStorage.getItem("checkoutPlan");
        if (checkoutPlan) {
          sessionStorage.removeItem("checkoutPlan");
          router.push(`/checkout?plan=${checkoutPlan}`);
        } else {
          router.push("/workspace/create");
        }
        router.refresh();
        return;
      }

      router.push("/auth/login");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function resendCode() {
    setResending(true);
    setResent(false);
    try {
      await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "email_verification" }),
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      setError("Failed to resend code");
    }
    setResending(false);
  }

  if (!email) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">
              No email provided. Please sign up first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">
            Verify your email
          </CardTitle>
          <CardDescription>
            We sent a 6-digit code to {email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-10 rounded border border-border bg-card text-center text-lg font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify email"}
            </Button>
            <button
              type="button"
              onClick={resendCode}
              disabled={resending}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {resent ? "Code sent!" : resending ? "Sending..." : "Resend code"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
