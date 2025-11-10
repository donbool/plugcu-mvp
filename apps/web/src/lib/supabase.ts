import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'student_org' | 'brand' | 'admin'
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'student_org' | 'brand' | 'admin'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student_org' | 'brand' | 'admin'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orgs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          university: string
          website_url: string | null
          logo_url: string | null
          contact_email: string | null
          phone: string | null
          member_count: number | null
          founded_year: number | null
          category: string | null
          status: 'pending' | 'verified' | 'rejected'
          verification_document_url: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          university: string
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          phone?: string | null
          member_count?: number | null
          founded_year?: number | null
          category?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          verification_document_url?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          university?: string
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          phone?: string | null
          member_count?: number | null
          founded_year?: number | null
          category?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          verification_document_url?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          user_id: string
          company_name: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          contact_email: string | null
          phone: string | null
          industry: string | null
          company_size: string | null
          status: 'pending' | 'verified' | 'rejected'
          target_demographics: string[]
          budget_range_min: number | null
          budget_range_max: number | null
          preferred_event_types: string[]
          geographic_focus: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          phone?: string | null
          industry?: string | null
          company_size?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          target_demographics?: string[]
          budget_range_min?: number | null
          budget_range_max?: number | null
          preferred_event_types?: string[]
          geographic_focus?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          phone?: string | null
          industry?: string | null
          company_size?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          target_demographics?: string[]
          budget_range_min?: number | null
          budget_range_max?: number | null
          preferred_event_types?: string[]
          geographic_focus?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string
          event_date: string | null
          application_deadline: string | null
          expected_attendance: number | null
          venue: string | null
          event_type: string | null
          sponsorship_min_amount: number | null
          sponsorship_max_amount: number | null
          sponsorship_benefits: string[]
          tags: string[]
          status: 'draft' | 'published' | 'closed'
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description: string
          event_date?: string | null
          application_deadline?: string | null
          expected_attendance?: number | null
          venue?: string | null
          event_type?: string | null
          sponsorship_min_amount?: number | null
          sponsorship_max_amount?: number | null
          sponsorship_benefits?: string[]
          tags?: string[]
          status?: 'draft' | 'published' | 'closed'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string
          event_date?: string | null
          application_deadline?: string | null
          expected_attendance?: number | null
          venue?: string | null
          event_type?: string | null
          sponsorship_min_amount?: number | null
          sponsorship_max_amount?: number | null
          sponsorship_benefits?: string[]
          tags?: string[]
          status?: 'draft' | 'published' | 'closed'
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Client-side Supabase client
export const createClientSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key || url.includes('placeholder')) {
    console.warn('Supabase not configured. Database features will not work.')
    // Return a mock client that won't crash the app
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithOtp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            execute: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => ({ execute: () => Promise.resolve({ data: [], error: null }) }),
          limit: () => ({ execute: () => Promise.resolve({ data: [], error: null }) }),
          execute: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => ({ execute: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }),
        update: () => ({ 
          eq: () => ({ execute: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) })
        }),
        upsert: () => ({ execute: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) })
      })
    } as any
  }
  
  return createClient<Database>(url, key)
}

// Note: Server-side client moved to separate file to avoid Next.js import issues