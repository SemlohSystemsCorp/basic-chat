import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validTypes = ["email_verification", "password_reset"];
    const codeType = validTypes.includes(type) ? type : "email_verification";

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate any existing unused codes for this email + type
    await supabaseAdmin
      .from("verification_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("type", codeType)
      .eq("used", false);

    // Store the new code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({ email, code, type: codeType, expires_at: expiresAt });

    if (insertError) {
      console.error("Failed to store verification code:", insertError);
      return NextResponse.json(
        { error: "Failed to send code" },
        { status: 500 }
      );
    }

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject =
      codeType === "password_reset"
        ? "Reset your Module password"
        : "Verify your Module email";

    const heading =
      codeType === "password_reset"
        ? "Password Reset Code"
        : "Email Verification Code";

    const description =
      codeType === "password_reset"
        ? "Use this code to reset your password:"
        : "Use this code to verify your email address:";

    await resend.emails.send({
      from: "Module <emails@georgeholmes.io>",
      to: email,
      subject,
      html: `
        <h2>${heading}</h2>
        <p>${description}</p>
        <div style="margin:24px 0;padding:16px 24px;background:#f4f4f5;border-radius:8px;text-align:center;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace;">${code}</span>
        </div>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
