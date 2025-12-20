// app/api/brands/[brandId]/route.js
// API endpoints for individual brand operations

import { supabaseAdmin } from '../../../../lib/supabase.js'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

// GET /api/brands/[brandId] - Get single brand
export async function GET(request, { params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brandId } = params

    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json({ brand: data })
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}

// PUT /api/brands/[brandId] - Update brand
export async function PUT(request, { params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brandId } = params
    const body = await request.json()
    const { brand_name, brand_description } = body

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('brand_profiles')
      .select('user_id')
      .eq('brand_id', brandId)
      .single()

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Update brand
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .update({
        brand_name: brand_name?.trim(),
        brand_description: brand_description,
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Log audit trail
    await supabaseAdmin.from('audit_log').insert([
      {
        user_id: userId,
        brand_id: brandId,
        action: 'update',
        resource_type: 'brand',
        resource_id: brandId
      }
    ])

    return NextResponse.json({ brand: data })
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

// DELETE /api/brands/[brandId] - Delete brand
export async function DELETE(request, { params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brandId } = params

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('brand_profiles')
      .select('user_id')
      .eq('brand_id', brandId)
      .single()

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Delete brand (CASCADE will remove all related data)
    const { error } = await supabaseAdmin
      .from('brand_profiles')
      .delete()
      .eq('brand_id', brandId)
      .eq('user_id', userId)

    if (error) throw error

    // Log audit trail
    await supabaseAdmin.from('audit_log').insert([
      {
        user_id: userId,
        brand_id: brandId,
        action: 'delete',
        resource_type: 'brand',
        resource_id: brandId
      }
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}
