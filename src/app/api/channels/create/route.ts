import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, description, boxId } = await request.json();

    if (!name || !boxId) {
      return NextResponse.json({ error: 'Channel name and boxId are required' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from('channels')
      .insert({
        box_id: boxId,
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description?.trim() || null,
        created_by: user.id,
      })
      .select('id, name, slug, description')
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'A channel with that name already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
