'use client'

import { useState, useEffect } from 'react'
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

const EVENT_TYPES = [
  'academic', 'social', 'professional', 'cultural', 'sports', 'competition',
  'networking', 'workshop', 'conference', 'festival', 'fundraising',
  'community service', 'tech', 'entrepreneurship', 'arts', 'music'
]

const SPONSORSHIP_BENEFITS = [
  'Logo on promotional materials',
  'Speaking opportunity',
  'Booth space',
  'Social media promotion',
  'Email marketing mention',
  'Website listing',
  'Product sampling opportunity',
  'Branded merchandise distribution',
  'VIP access',
  'Photography rights',
  'Video content rights',
  'Exclusive sponsor recognition'
]

export default function NewEventPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    application_deadline: '',
    expected_attendance: '',
    venue: '',
    event_type: '',
    sponsorship_min_amount: '',
    sponsorship_max_amount: '',
    sponsorship_benefits: [] as string[],
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: orgData } = await supabase
          .from('orgs')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (orgData) {
          setOrg(orgData)
        }
      } catch (error) {
        console.error('Error loading organization:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrg()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!org) throw new Error('No organization profile found')

      const eventData = {
        org_id: org.id,
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date || null,
        application_deadline: formData.application_deadline || null,
        expected_attendance: formData.expected_attendance ? parseInt(formData.expected_attendance) : null,
        venue: formData.venue || null,
        event_type: formData.event_type || null,
        sponsorship_min_amount: formData.sponsorship_min_amount ? parseInt(formData.sponsorship_min_amount) : null,
        sponsorship_max_amount: formData.sponsorship_max_amount ? parseInt(formData.sponsorship_max_amount) : null,
        sponsorship_benefits: formData.sponsorship_benefits,
        tags: formData.tags,
        status: formData.status,
        featured: false
      }

      const { error } = await supabase
        .from('events')
        .insert(eventData)

      if (error) throw error

      router.push('/dashboard/org/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
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

  const addBenefit = (benefit: string) => {
    if (benefit && !formData.sponsorship_benefits.includes(benefit)) {
      setFormData(prev => ({ 
        ...prev, 
        sponsorship_benefits: [...prev.sponsorship_benefits, benefit] 
      }))
    }
    setNewBenefit('')
  }

  const removeBenefit = (benefitToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      sponsorship_benefits: prev.sponsorship_benefits.filter(benefit => benefit !== benefitToRemove)
    }))
  }

  const toggleBenefit = (benefit: string) => {
    if (formData.sponsorship_benefits.includes(benefit)) {
      removeBenefit(benefit)
    } else {
      addBenefit(benefit)
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="student_org">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  if (!org) {
    return (
      <DashboardLayout requiredRole="student_org">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Organization Profile</h1>
          <p className="text-gray-600 mb-6">
            You need to create an organization profile before posting events.
          </p>
          <Button onClick={() => router.push('/dashboard/org/profile')}>
            Create Organization Profile
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="student_org">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-gray-600 mt-2">
            Post a sponsorship opportunity for your organization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Basic information about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Annual Debate Championship"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Event Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your event, its purpose, and what sponsors can expect..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="datetime-local"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="expected_attendance">Expected Attendance</Label>
                  <Input
                    id="expected_attendance"
                    type="number"
                    value={formData.expected_attendance}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_attendance: e.target.value }))}
                    placeholder="100"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g., University Auditorium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  value={formData.event_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Information</CardTitle>
              <CardDescription>
                Details about sponsorship opportunities and benefits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sponsorship_min_amount">Minimum Sponsorship ($)</Label>
                  <Input
                    id="sponsorship_min_amount"
                    type="number"
                    value={formData.sponsorship_min_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, sponsorship_min_amount: e.target.value }))}
                    placeholder="500"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsorship_max_amount">Maximum Sponsorship ($)</Label>
                  <Input
                    id="sponsorship_max_amount"
                    type="number"
                    value={formData.sponsorship_max_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, sponsorship_max_amount: e.target.value }))}
                    placeholder="5000"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sponsorship Benefits</Label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.sponsorship_benefits.map((benefit) => (
                      <Badge key={benefit} variant="default" className="cursor-pointer">
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(benefit)}
                          className="ml-2 text-red-200 hover:text-red-100"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Common Benefits</Label>
                    <div className="flex flex-wrap gap-2">
                      {SPONSORSHIP_BENEFITS.map((benefit) => (
                        <Badge
                          key={benefit}
                          variant={formData.sponsorship_benefits.includes(benefit) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleBenefit(benefit)}
                        >
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add custom benefit..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addBenefit(newBenefit)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addBenefit(newBenefit)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags & Categories</CardTitle>
              <CardDescription>
                Help brands discover your event
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

              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
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
                  Add Tag
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
              <CardDescription>
                Choose how to publish your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="draft"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  />
                  <Label htmlFor="draft">Save as Draft</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="published"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  />
                  <Label htmlFor="published">Publish Now</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/org/events')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.title || !formData.description}>
              {saving ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}