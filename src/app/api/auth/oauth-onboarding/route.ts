import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { displayName } = await request.json();

    if (!displayName?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const admin = await createServiceClient();

    // Check if email is already used by another profile
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', user.email!)
      .neq('id', user.id)
      .limit(1)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in with your original method.' },
        { status: 409 }
      );
    }

    // Update profile
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update auth user metadata too
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        display_name: displayName.trim(),
      },
    });

    // Send welcome email
    await sendWelcomeEmail(user.email!, displayName.trim());

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
