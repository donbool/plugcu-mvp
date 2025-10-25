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
import type { Organization } from '@/types'

const ORG_CATEGORIES = [
  'Academic', 'Cultural', 'Greek Life', 'Professional', 'Religious', 
  'Service', 'Social', 'Sports', 'Student Government', 'Other'
]

const COMMON_TAGS = [
  'networking', 'professional development', 'community service', 'social events',
  'academic', 'cultural', 'sports', 'competition', 'fundraising', 'awareness',
  'leadership', 'entrepreneurship', 'technology', 'arts', 'music'
]

export default function OrgProfilePage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    university: '',
    website_url: '',
    contact_email: '',
    phone: '',
    member_count: '',
    founded_year: '',
    category: '',
    tags: [] as string[]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgData } = await supabase
        .from('orgs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (orgData) {
        setOrg(orgData)
        setFormData({
          name: orgData.name || '',
          description: orgData.description || '',
          university: orgData.university || '',
          website_url: orgData.website_url || '',
          contact_email: orgData.contact_email || '',
          phone: orgData.phone || '',
          member_count: orgData.member_count?.toString() || '',
          founded_year: orgData.founded_year?.toString() || '',
          category: orgData.category || '',
          tags: orgData.tags || []
        })
      }

      setLoading(false)
    }

    fetchOrg()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const orgData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        university: formData.university,
        website_url: formData.website_url || null,
        contact_email: formData.contact_email || null,
        phone: formData.phone || null,
        member_count: formData.member_count ? parseInt(formData.member_count) : null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        category: formData.category || null,
        tags: formData.tags,
        status: 'pending' // Reset to pending when updating
      }

      if (org) {
        // Update existing org
        const { error } = await supabase
          .from('orgs')
          .update(orgData)
          .eq('id', org.id)

        if (error) throw error
      } else {
        // Create new org
        const { error } = await supabase
          .from('orgs')
          .insert(orgData)

        if (error) throw error
      }

      router.push('/dashboard/org')
    } catch (error) {
      console.error('Error saving organization:', error)
      alert('Failed to save organization profile')
    } finally {
      setSaving(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="student_org">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="student_org">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {org ? 'Edit Organization Profile' : 'Create Organization Profile'}
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your organization profile to start connecting with brands
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Tell us about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Columbia Debate Society"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University *</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="e.g., Columbia University"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your organization's mission and activities..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a category</option>
                    {ORG_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member_count">Member Count</Label>
                  <Input
                    id="member_count"
                    type="number"
                    value={formData.member_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, member_count: e.target.value }))}
                    placeholder="50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How should brands contact your organization?
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
                    placeholder="president@organization.edu"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://www.organization.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded_year">Founded Year</Label>
                  <Input
                    id="founded_year"
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, founded_year: e.target.value }))}
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags & Interests</CardTitle>
              <CardDescription>
                Add tags to help brands find your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Custom Tag</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(newTag)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(newTag)}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Common Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => formData.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    >
                      {tag}
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
              onClick={() => router.push('/dashboard/org')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.name || !formData.university}>
              {saving ? 'Saving...' : (org ? 'Update Profile' : 'Create Profile')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}