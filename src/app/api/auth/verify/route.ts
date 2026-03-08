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

    // Find the user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the user's metadata to check the code
    const { data: userData } = await supabase.auth.admin.getUserById(
      profile.id
    );

    if (!userData?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const storedCode = userData.user.user_metadata?.verification_code;
    const expiresAt = userData.user.user_metadata?.verification_code_expires;

    if (!storedCode || !expiresAt) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Code expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check code match
    if (storedCode !== code) {
      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear the code
    await supabase.auth.admin.updateUserById(profile.id, {
      email_confirm: true,
      user_metadata: {
        ...userData.user.user_metadata,
        email_verified: true,
        verification_code: null,
        verification_code_expires: null,
      },
    });

    await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', profile.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
