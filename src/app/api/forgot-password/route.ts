import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists (but always return success to prevent enumeration)
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Invalidate existing unused tokens
    await supabaseAdmin
      .from("verification_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("type", "password_reset")
      .eq("used", false);

    // Store the token
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({ email, code: token, type: "password_reset", expires_at: expiresAt });

    if (insertError) {
      console.error("Failed to store reset token:", insertError);
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }

    // Build the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://georgeholmes.io";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Module <emails@georgeholmes.io>",
      to: email,
      subject: "Reset your Module password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password:</p>
        <div style="margin:24px 0;">
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            Reset Password
          </a>
        </div>
        <p style="color:#71717a;font-size:13px;">Or copy and paste this link into your browser:</p>
        <p style="color:#71717a;font-size:13px;word-break:break-all;">${resetLink}</p>
        <p style="color:#71717a;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}
