'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Brand } from '@/types'

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Food & Beverage',
  'Automotive', 'Entertainment', 'Fashion', 'Sports', 'Media', 'Non-profit', 'Other'
]

const COMPANY_SIZES = [
  'startup', 'small', 'medium', 'enterprise'
]

const TARGET_DEMOGRAPHICS = [
  'college students', '18-24', '25-34', 'Gen Z', 'millennials',
  'tech-savvy', 'sports enthusiasts', 'music lovers', 'young professionals',
  'entrepreneurs', 'creatives', 'academics', 'social activists'
]

const EVENT_TYPES = [
  'academic', 'social', 'professional', 'cultural', 'sports', 'competition',
  'networking', 'workshop', 'conference', 'festival', 'fundraising',
  'community service', 'tech', 'entrepreneurship', 'arts', 'music'
]

const GEOGRAPHIC_REGIONS = [
  'New York', 'California', 'Northeast', 'West Coast', 'Midwest', 'South',
  'Major cities', 'College towns', 'Urban areas', 'Suburban areas'
]

export default function BrandProfilePage() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    website_url: '',
    contact_email: '',
    phone: '',
    industry: '',
    company_size: '',
    target_demographics: [] as string[],
    budget_range_min: '',
    budget_range_max: '',
    preferred_event_types: [] as string[],
    geographic_focus: [] as string[]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchBrand = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: brandData } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (brandData) {
        setBrand(brandData)
        setFormData({
          company_name: brandData.company_name || '',
          description: brandData.description || '',
          website_url: brandData.website_url || '',
          contact_email: brandData.contact_email || '',
          phone: brandData.phone || '',
          industry: brandData.industry || '',
          company_size: brandData.company_size || '',
          target_demographics: brandData.target_demographics || [],
          budget_range_min: brandData.budget_range_min?.toString() || '',
          budget_range_max: brandData.budget_range_max?.toString() || '',
          preferred_event_types: brandData.preferred_event_types || [],
          geographic_focus: brandData.geographic_focus || []
        })
      }

      setLoading(false)
    }

    fetchBrand()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const brandData = {
        user_id: user.id,
        company_name: formData.company_name,
        description: formData.description || null,
        website_url: formData.website_url || null,
        contact_email: formData.contact_email || null,
        phone: formData.phone || null,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        target_demographics: formData.target_demographics,
        budget_range_min: formData.budget_range_min ? parseInt(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseInt(formData.budget_range_max) : null,
        preferred_event_types: formData.preferred_event_types,
        geographic_focus: formData.geographic_focus,
        status: 'pending' // Reset to pending when updating
      }

      if (brand) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', brand.id)

        if (error) throw error
      } else {
        // Create new brand
        const { error } = await supabase
          .from('brands')
          .insert(brandData)

        if (error) throw error
      }

      router.push('/dashboard/brand')
    } catch (error) {
      console.error('Error saving brand:', error)
      alert('Failed to save brand profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string, setArray: (items: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item))
    } else {
      setArray([...array, item])
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="brand">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="brand">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {brand ? 'Edit Brand Profile' : 'Create Brand Profile'}
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your brand profile to discover and connect with student organizations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Tell us about your company and brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g., Spotify"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your company and what you do..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <select
                    id="company_size"
                    value={formData.company_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_size: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select company size</option>
                    {COMPANY_SIZES.map(size => (
                      <option key={size} value={size}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How should organizations contact you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="partnerships@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Preferences</CardTitle>
              <CardDescription>
                Help us match you with relevant opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget_range_min">Minimum Budget ($)</Label>
                  <Input
                    id="budget_range_min"
                    type="number"
                    value={formData.budget_range_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_range_min: e.target.value }))}
                    placeholder="1000"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_range_max">Maximum Budget ($)</Label>
                  <Input
                    id="budget_range_max"
                    type="number"
                    value={formData.budget_range_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_range_max: e.target.value }))}
                    placeholder="10000"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Demographics</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_DEMOGRAPHICS.map((demo) => (
                    <Badge
                      key={demo}
                      variant={formData.target_demographics.includes(demo) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(
                        formData.target_demographics, 
                        demo, 
                        (items) => setFormData(prev => ({ ...prev, target_demographics: items }))
                      )}
                    >
                      {demo}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Event Types</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.preferred_event_types.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(
                        formData.preferred_event_types, 
                        type, 
                        (items) => setFormData(prev => ({ ...prev, preferred_event_types: items }))
                      )}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Geographic Focus</Label>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIC_REGIONS.map((region) => (
                    <Badge
                      key={region}
                      variant={formData.geographic_focus.includes(region) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(
                        formData.geographic_focus, 
                        region, 
                        (items) => setFormData(prev => ({ ...prev, geographic_focus: items }))
                      )}
                    >
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/brand')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.company_name}>
              {saving ? 'Saving...' : (brand ? 'Update Profile' : 'Create Profile')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}