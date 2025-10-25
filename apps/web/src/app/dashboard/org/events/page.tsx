'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Event, Organization } from '@/types'

export default function OrgEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get organization
      const { data: orgData } = await supabase
        .from('orgs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!orgData) {
        setLoading(false)
        return
      }

      setOrg(orgData)

      // Get events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <Link href="/dashboard/org/profile">
            <Button>Create Organization Profile</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="student_org">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-gray-600">Manage your sponsorship opportunities</p>
          </div>
          <Link href="/dashboard/org/events/new">
            <Button>Create New Event</Button>
          </Link>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first sponsorship opportunity to start connecting with brands.
              </p>
              <Link href="/dashboard/org/events/new">
                <Button>Create Your First Event</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                    {event.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    {event.event_date && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                    )}
                    
                    {event.expected_attendance && (
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{event.expected_attendance} expected attendees</span>
                      </div>
                    )}
                    
                    {event.sponsorship_min_amount && (
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span>
                          ${event.sponsorship_min_amount.toLocaleString()}
                          {event.sponsorship_max_amount && 
                            ` - $${event.sponsorship_max_amount.toLocaleString()}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.venue}</span>
                      </div>
                    )}
                  </div>

                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/org/events/${event.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/org/events/${event.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.length}
              </div>
              <div className="text-sm text-gray-600">Total Events</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'published').length}
              </div>
              <div className="text-sm text-gray-600">Published</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Drafts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.featured).length}
              </div>
              <div className="text-sm text-gray-600">Featured</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}