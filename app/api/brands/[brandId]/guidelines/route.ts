// app/api/brands/[brandId]/guidelines/route.ts
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GuidelinesUpdate {
  primary_colors?: Array<{
    hex: string;
    name?: string;
    usage?: string;
  }>;
  typography?: {
    primary?: string;
    secondary?: string;
    rules?: string;
  };
  visual_rules?: string;
  tone_keywords?: string[];
  industry?: string;
  guidelines_document_url?: string;
}

// GET - Fetch current guidelines for a brand
export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = params;

    // Fetch brand with guidelines (verify ownership)
    const { data: brand, error } = await supabase
      .from('brand_profiles')
      .select(`
        brand_id,
        brand_name,
        primary_colors,
        typography,
        visual_rules,
        tone_keywords,
        industry,
        guidelines_source,
        guidelines_updated_at,
        guidelines_document_url
      `)
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .single();

    if (error || !brand) {
      return NextResponse.json(
        { error: 'Brand not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ brand });

  } catch (error) {
    console.error('Error fetching brand guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guidelines' },
      { status: 500 }
    );
  }
}

// PATCH - Update guidelines for a brand
export async function PATCH(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = params;
    const body: GuidelinesUpdate = await request.json();

    // Verify brand ownership first
    const { data: existingBrand, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('brand_id, user_id')
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBrand) {
      return NextResponse.json(
        { error: 'Brand not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {
      guidelines_source: 'manual',
      guidelines_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (body.primary_colors !== undefined) {
      // Validate color format
      if (Array.isArray(body.primary_colors)) {
        const validColors = body.primary_colors.every(
          (c) => typeof c.hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c.hex)
        );
        if (!validColors) {
          return NextResponse.json(
            { error: 'Invalid color format. Use hex codes like #00FF87' },
            { status: 400 }
          );
        }
      }
      updateData.primary_colors = body.primary_colors;
    }

    if (body.typography !== undefined) {
      updateData.typography = body.typography;
    }

    if (body.visual_rules !== undefined) {
      updateData.visual_rules = body.visual_rules;
    }

    if (body.tone_keywords !== undefined) {
      // Ensure it's an array of strings
      if (!Array.isArray(body.tone_keywords)) {
        return NextResponse.json(
          { error: 'tone_keywords must be an array of strings' },
          { status: 400 }
        );
      }
      updateData.tone_keywords = body.tone_keywords;
    }

    if (body.industry !== undefined) {
      updateData.industry = body.industry;
    }

    if (body.guidelines_document_url !== undefined) {
      updateData.guidelines_document_url = body.guidelines_document_url;
    }

    // Update the brand
    const { data: updatedBrand, error: updateError } = await supabase
      .from('brand_profiles')
      .update(updateData)
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update guidelines' },
        { status: 500 }
      );
    }

    // Log to audit trail
    await supabase.from('audit_log').insert({
      user_id: userId,
      brand_id: brandId,
      action: 'guidelines_updated',
      resource_type: 'brand_profile',
      resource_id: brandId,
    });

    return NextResponse.json({
      success: true,
      brand: updatedBrand,
      message: 'Brand guidelines updated successfully',
    });

  } catch (error) {
    console.error('Error updating brand guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to update guidelines' },
      { status: 500 }
    );
  }
}
