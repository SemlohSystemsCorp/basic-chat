import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendInviteEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email, boxId } = await request.json();

    if (!email || !boxId) {
      return NextResponse.json({ error: 'Email and boxId are required' }, { status: 400 });
    }

    // Get the authenticated user
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify user is admin/owner of this box
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('box_members')
      .select('id')
      .eq('box_id', boxId)
      .eq('user_id', (
        await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).single()
      ).data?.id || '00000000-0000-0000-0000-000000000000')
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a member' }, { status: 400 });
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id')
      .eq('box_id', boxId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'An invite has already been sent to this email' }, { status: 400 });
    }

    // Get box info
    const { data: box } = await supabase
      .from('boxes')
      .select('name, invite_code')
      .eq('id', boxId)
      .single();

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 });
    }

    // Get inviter name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Create the invite
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        box_id: boxId,
        email: email.toLowerCase(),
        invited_by: user.id,
      })
      .select('id, code')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send email via Resend
    try {
      await sendInviteEmail(
        email.toLowerCase(),
        box.name,
        profile?.display_name || 'Someone',
        invite.code
      );
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't fail the whole request if email fails — invite is still created
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite send error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
