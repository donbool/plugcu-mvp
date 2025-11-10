'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Organization, Event } from '@/types'

export default function OrgDashboard() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabase()

  // DISABLED: All database calls disabled to reduce network pinging
  // useEffect(() => {
  //   const fetchData = async () => {
  //     ...database calls...
  //   }
  //   fetchData()
  // }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
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

          // Fetch only recent events with limited fields for speed
          const { data: eventsData } = await supabase
            .from('events')
            .select('id, title, status, created_at, updated_at, event_date')
            .eq('org_id', orgData.id)
            .order('created_at', { ascending: false })
            .limit(20)

          setEvents(eventsData || [])
        } else {
          setOrg(null)
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading org dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to PlugCU!</h1>
          <p className="text-gray-600 mb-8">
            Let&apos;s get started by setting up your organization profile.
          </p>
          <Link href="/dashboard/org/profile">
            <Button size="lg">Create Organization Profile</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout requiredRole="student_org">
      <div className="space-y-8">
        {/* Organization Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>{org.university}</CardDescription>
                </div>
                <Badge className={getStatusColor(org.status)}>
                  {org.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{org.description}</p>
              <div className="flex flex-wrap gap-2">
                {org.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Events</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === 'published').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Members</p>
                <p className="text-2xl font-bold">{org.member_count || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Your latest sponsorship opportunities</CardDescription>
              </div>
              <Link href="/dashboard/org/events/new">
                <Button>Create Event</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No events created yet</p>
                <Link href="/dashboard/org/events/new">
                  <Button variant="outline">Create Your First Event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge 
                        variant={event.status === 'published' ? 'default' : 'secondary'}
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {event.event_date && (
                        <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                      )}
                      {event.expected_attendance && (
                        <span>👥 {event.expected_attendance} attendees</span>
                      )}
                      {event.sponsorship_min_amount && (
                        <span>💰 ${event.sponsorship_min_amount}+</span>
                      )}
                    </div>
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-center pt-4">
                    <Link href="/dashboard/org/events">
                      <Button variant="outline">View All Events</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        {org.status === 'pending' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Profile Under Review</CardTitle>
              <CardDescription className="text-yellow-700">
                Your organization profile is being reviewed. You&apos;ll be notified once it&apos;s approved.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}