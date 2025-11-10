'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Event, Organization } from '@/types'

interface ExtendedEvent extends Event {
  orgs: Organization
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<ExtendedEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const { data: eventData, error: fetchError } = await supabase
          .from('events')
          .select(`
            *,
            orgs(*)
          `)
          .eq('id', eventId)
          .single()

        if (fetchError) throw fetchError

        // Verify ownership
        if (eventData.orgs.user_id !== user.id) {
          setError('Unauthorized')
          setLoading(false)
          return
        }

        setEvent(eventData as ExtendedEvent)
      } catch (err) {
        console.error('Error loading event:', err)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId, supabase])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="student_org">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  if (error || !event) {
    return (
      <DashboardLayout requiredRole="student_org">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The event could not be found.'}</p>
          <Link href="/dashboard/org/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="student_org">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              {event.featured && (
                <Badge variant="default">Featured</Badge>
              )}
            </div>
            <p className="text-gray-600">{event.orgs.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/org/events/${event.id}/edit`}>
              <Button>Edit Event</Button>
            </Link>
            <Link href="/dashboard/org/events">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Event Date</p>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Application Deadline</p>
                    <p className="font-medium">{formatDate(event.application_deadline)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Event Type</p>
                    <p className="font-medium capitalize">
                      {event.event_type ? event.event_type.replace('_', ' ') : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Attendance</p>
                    <p className="font-medium">
                      {event.expected_attendance ? event.expected_attendance.toLocaleString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Venue</p>
                    <p className="font-medium">{event.venue || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sponsorship Information */}
            <Card>
              <CardHeader>
                <CardTitle>Sponsorship Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Budget Range</p>
                  <p className="font-medium text-lg">
                    {event.sponsorship_min_amount && event.sponsorship_max_amount
                      ? `$${event.sponsorship_min_amount.toLocaleString()} - $${event.sponsorship_max_amount.toLocaleString()}`
                      : event.sponsorship_min_amount
                      ? `$${event.sponsorship_min_amount.toLocaleString()}+`
                      : 'Not specified'
                    }
                  </p>
                </div>

                {event.sponsorship_benefits.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Sponsorship Benefits</p>
                    <div className="flex flex-wrap gap-2">
                      {event.sponsorship_benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {event.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <Badge className={`${getStatusColor(event.status)} text-base mt-2`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {event.status === 'published' && 'This event is live and visible to brands.'}
                  {event.status === 'draft' && 'This event is in draft mode and not visible to brands.'}
                  {event.status === 'closed' && 'This event has been closed and no longer accepting sponsorships.'}
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/org/events/${event.id}/edit`} className="block">
                  <Button className="w-full" variant="outline">Edit Event</Button>
                </Link>
                <Button className="w-full" variant="outline">View Inquiries</Button>
              </CardContent>
            </Card>

            {/* Created Information */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">
                    {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium">
                    {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
