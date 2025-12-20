// app/api/brands/route.js
// API endpoints for brand profile operations

import { supabaseAdmin } from '../../../lib/supabase.js'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

// GET /api/brands - List all brands for current user
export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

   console.log('Supabase query result:', { data, error })

if (error) {
  console.error('Supabase error details:', error)
  throw error
}

    return NextResponse.json({ brands: data })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

// POST /api/brands - Create new brand
export async function POST(request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_name, brand_description } = body

    if (!brand_name || brand_name.trim() === '') {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
    }

    // Create brand
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .insert([
        {
          user_id: userId,
          brand_name: brand_name.trim(),
          brand_description: brand_description || ''
        }
      ])
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You already have a brand with this name' },
          { status: 409 }
        )
      }
      throw error
    }

    // Log audit trail
    await supabaseAdmin.from('audit_log').insert([
      {
        user_id: userId,
        brand_id: data.brand_id,
        action: 'create',
        resource_type: 'brand',
        resource_id: data.brand_id
      }
    ])

    return NextResponse.json({ brand: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
