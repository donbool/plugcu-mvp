'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Brand, Event } from '@/types'

export default function BrandDashboard() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [matchCount, setMatchCount] = useState(0)
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

        const { data: brandData } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (brandData) {
          setBrand(brandData)

          // Get match count
          const { data: matchesData } = await supabase
            .from('matches')
            .select('id')
            .eq('brand_id', brandData.id)

          setMatchCount(matchesData?.length || 0)
        } else {
          setBrand(null)
        }

        // Get recent events
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3)

        setRecentEvents(eventsData || [])
      } catch (error) {
        console.error('Error loading brand dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout requiredRole="brand">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  if (!brand) {
    return (
      <DashboardLayout requiredRole="brand">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to PlugCU!</h1>
          <p className="text-gray-600 mb-8">
            Let's get started by setting up your brand profile to discover sponsorship opportunities.
          </p>
          <Link href="/dashboard/brand/profile">
            <Button size="lg">Create Brand Profile</Button>
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
    <DashboardLayout requiredRole="brand">
      <div className="space-y-8">
        {/* Brand Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{brand.company_name}</CardTitle>
                  <CardDescription>{brand.industry}</CardDescription>
                </div>
                <Badge className={getStatusColor(brand.status)}>
                  {brand.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{brand.description}</p>
              <div className="flex flex-wrap gap-2">
                {brand.target_demographics.map((demo) => (
                  <Badge key={demo} variant="secondary">
                    {demo}
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
                <p className="text-sm text-gray-600">Available Matches</p>
                <p className="text-2xl font-bold">{matchCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget Range</p>
                <p className="text-2xl font-bold">
                  {brand.budget_range_min && brand.budget_range_max 
                    ? `$${brand.budget_range_min.toLocaleString()} - $${brand.budget_range_max.toLocaleString()}`
                    : 'Not set'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Target Regions</p>
                <p className="text-lg font-bold">{brand.geographic_focus.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/brand/discover">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-semibold mb-2">Discover Events</h3>
                <p className="text-sm text-gray-600">Browse sponsorship opportunities</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/brand/matches">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold mb-2">View Matches</h3>
                <p className="text-sm text-gray-600">See AI-powered recommendations</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/brand/messages">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-semibold mb-2">Messages</h3>
                <p className="text-sm text-gray-600">Connect with organizations</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Events Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Latest Sponsorship Opportunities</CardTitle>
                <CardDescription>Recently posted events from student organizations</CardDescription>
              </div>
              <Link href="/dashboard/brand/discover">
                <Button>Browse All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No recent events available</p>
                <Link href="/dashboard/brand/discover">
                  <Button variant="outline">Explore Events</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant="secondary">
                        {(event as any).orgs?.university}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🏛️ {(event as any).orgs?.name}</span>
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
                    <div className="flex flex-wrap gap-1 mt-3">
                      {event.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Alerts */}
        {brand.status === 'pending' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Profile Under Review</CardTitle>
              <CardDescription className="text-yellow-700">
                Your brand profile is being reviewed. You'll be notified once it's approved.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {brand.status === 'verified' && (!brand.budget_range_min || !brand.budget_range_max) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Complete Your Profile</CardTitle>
              <CardDescription className="text-blue-700">
                Set your budget range to get better sponsorship matches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/brand/profile">
                <Button variant="outline">Update Profile</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}