import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalidate existing unused codes
    await supabaseAdmin
      .from("verification_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("type", "password_reset")
      .eq("used", false);

    // Store the code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({ email, code, type: "password_reset", expires_at: expiresAt });

    if (insertError) {
      console.error("Failed to store reset code:", insertError);
      return NextResponse.json(
        { error: "Failed to send reset code" },
        { status: 500 }
      );
    }

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Module <emails@georgeholmes.io>",
      to: email,
      subject: "Reset your Module password",
      html: `
        <h2>Password Reset Code</h2>
        <p>Use this code to reset your password:</p>
        <div style="margin:24px 0;padding:16px 24px;background:#f4f4f5;border-radius:8px;text-align:center;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace;">${code}</span>
        </div>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send reset code" },
      { status: 500 }
    );
  }
}
