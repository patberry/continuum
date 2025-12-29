import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all brands for authenticated user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brands, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new brand
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, guidelines } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const { data: brand, error } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: userId,
        brand_name: name.trim(),
        brand_description: description?.trim() || null,
        brand_guidelines: guidelines || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create brand:', error);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('Brands POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a brand
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, guidelines } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('brand_id')
      .eq('brand_id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const { data: brand, error } = await supabase
      .from('brand_profiles')
      .update({
        brand_name: name.trim(),
        brand_description: description?.trim() || null,
        brand_guidelines: guidelines || null,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update brand:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Brands PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a brand
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('brand_id')
      .eq('brand_id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('brand_profiles')
      .delete()
      .eq('brand_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete brand:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Brands DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}