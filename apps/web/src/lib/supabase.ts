import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
export const createClientSupabase = () => createClientComponentClient<Database>()

// Server-side Supabase client
export const createServerSupabase = () => createServerComponentClient<Database>({ cookies })