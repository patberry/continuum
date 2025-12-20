// lib/supabase.js
// Supabase client for database operations

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// DEBUG: Check if env vars are loading
console.log('Supabase URL:', supabaseUrl)
console.log('Anon Key exists?', !!supabaseAnonKey)
console.log('Service Key exists?', !!supabaseServiceKey)

// Client for browser (uses RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
