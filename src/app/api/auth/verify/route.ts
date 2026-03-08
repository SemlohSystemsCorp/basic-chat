import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find the most recent unused code for this email
    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (verificationCode.attempts >= verificationCode.max_attempts) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: verificationCode.attempts + 1 })
      .eq('id', verificationCode.id);

    // Check expiration
    if (new Date(verificationCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check code match
    if (verificationCode.code !== code) {
      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400 }
      );
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verificationCode.id);

    // Find the user profile and mark as verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profile) {
      await supabase.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
        user_metadata: {
          email_verified: true,
        },
      });

      await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', profile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
