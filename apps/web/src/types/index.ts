export type UserRole = 'student_org' | 'brand' | 'admin'

export type User = {
  id: string
  email: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Organization = {
  id: string
  user_id: string
  name: string
  description?: string
  university: string
  website_url?: string
  logo_url?: string
  contact_email?: string
  phone?: string
  member_count?: number
  founded_year?: number
  category?: string
  status: 'pending' | 'verified' | 'rejected'
  verification_document_url?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type Brand = {
  id: string
  user_id: string
  company_name: string
  description?: string
  website_url?: string
  logo_url?: string
  contact_email?: string
  phone?: string
  industry?: string
  company_size?: string
  status: 'pending' | 'verified' | 'rejected'
  target_demographics: string[]
  budget_range_min?: number
  budget_range_max?: number
  preferred_event_types: string[]
  geographic_focus: string[]
  created_at: string
  updated_at: string
}

export type Event = {
  id: string
  org_id: string
  title: string
  description: string
  event_date?: string
  application_deadline?: string
  expected_attendance?: number
  venue?: string
  event_type?: string
  sponsorship_min_amount?: number
  sponsorship_max_amount?: number
  sponsorship_benefits: string[]
  tags: string[]
  status: 'draft' | 'published' | 'closed'
  featured: boolean
  created_at: string
  updated_at: string
}

export type Match = {
  id: string
  brand_id: string
  event_id: string
  score: number
  reasoning: {
    tag_overlap_score: number
    budget_alignment_score: number
    attendance_score: number
    recency_score: number
    demographic_match_score: number
    explanation: string
    matched_tags: string[]
    budget_fit: string
    attendance_category: string
  }
  created_at: string
}

export type Thread = {
  id: string
  brand_id: string
  org_id: string
  event_id?: string
  subject?: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  thread_id: string
  sender_id: string
  content: string
  read_at?: string
  created_at: string
}