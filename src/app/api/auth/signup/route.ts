import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendVerificationCode } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any existing codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email)
      .is('used_at', null);

    // Store the code in the database
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
      });

    if (insertError) {
      console.error('Failed to store verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    await sendVerificationCode(email, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
