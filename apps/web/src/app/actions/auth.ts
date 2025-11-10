'use server'

import { createClient } from '@supabase/supabase-js'

export async function createUserProfile(
  userId: string,
  email: string,
  role: string,
  fullName: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase.from('users').insert({
    id: userId,
    email,
    role,
    full_name: fullName,
  })

  if (error) {
    console.error('Error creating user profile:', error)
    throw error
  }

  return { success: true }
}

export async function getUserRole(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user role:', error)
    return null
  }

  return data?.role || null
}

export async function getUserProfile(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data || null
}
