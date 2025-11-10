'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Event, Brand } from '@/types'

interface ExtendedEvent extends Event {
  orgs: {
    name: string
    university: string
    category: string | null
  }
}

export default function BrandDiscoverPage() {
  const [events, setEvents] = useState<ExtendedEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<ExtendedEvent[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    minBudget: '',
    maxBudget: '',
    university: '',
    eventType: '',
    minAttendance: '',
    maxAttendance: ''
  })
  
  const supabase = createClientSupabase()

  // DISABLED: useEffect hook - all database calls disabled to reduce network requests
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     if (!user) return
  //
  //     // Record page view (disabled for now - data collection paused)
  //     // await supabase.from('interactions').insert({
  //     //   user_id: user.id,
  //     //   action_type: 'view',
  //     //   target_type: 'page',
  //     //   target_id: 'discover',
  //     //   metadata: { page: 'brand_discover' }
  //     // })
  //
  //     // Get brand profile
  //     const { data: brandData } = await supabase
  //       .from('brands')
  //       .select('*')
  //       .eq('user_id', user.id)
  //       .single()
  //
  //     setBrand(brandData)
  //
  //     // Get published events with organization info
  //     const { data: eventsData } = await supabase
  //       .from('events')
  //       .select(`
  //         *,
  //         orgs(name, university, category)
  //       `)
  //       .eq('status', 'published')
  //       .order('created_at', { ascending: false })
  //
  //     const events = eventsData as ExtendedEvent[] || []
  //     setEvents(events)
  //     setFilteredEvents(events)
  //     setLoading(false)
  //   }
  //
  //   fetchData()
  // }, [supabase])

  useEffect(() => {
    let isMounted = true

    // Only fetch once on mount
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) {
          setLoading(false)
          return
        }

        // Fetch brand and events in parallel for speed
        const [brandRes, eventsRes] = await Promise.all([
          supabase
            .from('brands')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('events')
            .select(`
              id,
              title,
              description,
              event_date,
              status,
              featured,
              expected_attendance,
              sponsorship_min_amount,
              sponsorship_max_amount,
              sponsorship_benefits,
              tags,
              event_type,
              orgs(name, university, category)
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(50)
        ])

        if (!isMounted) return

        if (brandRes.data) {
          setBrand(brandRes.data)
        }

        const events = eventsRes.data as ExtendedEvent[] || []
        setEvents(events)
        setFilteredEvents(events)
      } catch (error) {
        console.error('Error loading discover page:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    // Record search interactions (disabled for now - data collection paused)
    const recordSearchInteraction = async () => {
      // if (filters.search && filters.search.length > 2) {
      //   const { data: { user } } = await supabase.auth.getUser()
      //   if (user) {
      //     await supabase.from('interactions').insert({
      //       user_id: user.id,
      //       action_type: 'search',
      //       target_type: 'events',
      //       target_id: 'discover_search',
      //       metadata: {
      //         search_term: filters.search,
      //         filters_applied: Object.entries(filters).filter(([key, value]) => key !== 'search' && value).length
      //       }
      //     })
      //   }
      // }
    }

    // Apply filters
    let filtered = events.filter(event => {
      // Skip events without org data
      if (!event.orgs) return false

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.orgs.name.toLowerCase().includes(searchLower) ||
          event.orgs.university.toLowerCase().includes(searchLower) ||
          event.tags.some(tag => tag.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Budget filters
      if (filters.minBudget && event.sponsorship_max_amount) {
        if (event.sponsorship_max_amount < parseInt(filters.minBudget)) return false
      }
      if (filters.maxBudget && event.sponsorship_min_amount) {
        if (event.sponsorship_min_amount > parseInt(filters.maxBudget)) return false
      }

      // University filter
      if (filters.university) {
        if (!event.orgs.university.toLowerCase().includes(filters.university.toLowerCase())) return false
      }

      // Event type filter
      if (filters.eventType) {
        if (event.event_type !== filters.eventType) return false
      }

      // Attendance filters
      if (filters.minAttendance && event.expected_attendance) {
        if (event.expected_attendance < parseInt(filters.minAttendance)) return false
      }
      if (filters.maxAttendance && event.expected_attendance) {
        if (event.expected_attendance > parseInt(filters.maxAttendance)) return false
      }

      return true
    })

    setFilteredEvents(filtered)

    // Record search interaction with debounce
    const timeoutId = setTimeout(recordSearchInteraction, 1000)
    return () => clearTimeout(timeoutId)
  }, [events, filters])

  const handleContactOrg = async (event: ExtendedEvent) => {
    if (!brand) {
      alert('Please complete your brand profile first')
      return
    }

    try {
      // Check if thread already exists
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('brand_id', brand.id)
        .eq('org_id', event.org_id)
        .eq('event_id', event.id)
        .single()

      if (existingThread) {
        // Thread exists, redirect to messages
        window.location.href = '/dashboard/brand/messages'
        return
      }

      // Create new thread
      const { data: newThread, error } = await supabase
        .from('threads')
        .insert({
          brand_id: brand.id,
          org_id: event.org_id,
          event_id: event.id,
          subject: `Sponsorship Inquiry: ${event.title}`
        })
        .select()
        .single()

      if (error) throw error

      // Create initial message
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('messages')
          .insert({
            thread_id: newThread.id,
            sender_id: user.id,
            content: `Hi! I'm interested in learning more about sponsorship opportunities for "${event.title}". Could we discuss the details?`
          })
      }

      // Redirect to messages
      window.location.href = '/dashboard/brand/messages'
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to start conversation')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      minBudget: '',
      maxBudget: '',
      university: '',
      eventType: '',
      minAttendance: '',
      maxAttendance: ''
    })
  }

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
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">
            You need to complete your brand profile to discover sponsorship opportunities.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/brand/profile'}>
            Complete Brand Profile
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const eventTypes = [...new Set(events.map(e => e.event_type).filter((type): type is string => Boolean(type)))]
  const universities = [...new Set(events.map(e => e.orgs?.university).filter((uni): uni is string => Boolean(uni)))]

  return (
    <DashboardLayout requiredRole="brand">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Discover Events</h1>
            <p className="text-gray-600">Find sponsorship opportunities that match your brand</p>
          </div>
          <div className="text-sm text-gray-600">
            {filteredEvents.length} of {events.length} events
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Narrow down your search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search events, orgs, universities..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <select
                  id="university"
                  value={filters.university}
                  onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Universities</option>
                  {universities.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Budget Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={filters.minBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBudget: e.target.value }))}
                    placeholder="Min $"
                  />
                  <Input
                    type="number"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: e.target.value }))}
                    placeholder="Max $"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attendance</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={filters.minAttendance}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAttendance: e.target.value }))}
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={filters.maxAttendance}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAttendance: e.target.value }))}
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters to find more sponsorship opportunities.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">
                      {event.orgs?.university || 'Unknown'}
                    </Badge>
                    {event.featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription>
                    <span className="font-medium">{event.orgs?.name || 'Unknown Organization'}</span>
                    {event.orgs?.category && ` • ${event.orgs.category}`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-700 line-clamp-3">{event.description}</p>
                  
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
                        <span>{event.expected_attendance.toLocaleString()} expected attendees</span>
                      </div>
                    )}
                    
                    {(event.sponsorship_min_amount || event.sponsorship_max_amount) && (
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span>
                          {event.sponsorship_min_amount && `$${event.sponsorship_min_amount.toLocaleString()}`}
                          {event.sponsorship_min_amount && event.sponsorship_max_amount && ' - '}
                          {event.sponsorship_max_amount && `$${event.sponsorship_max_amount.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                    
                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.venue}</span>
                      </div>
                    )}

                    {event.application_deadline && (
                      <div className="flex items-center gap-2">
                        <span>⏰</span>
                        <span>Apply by {formatDate(event.application_deadline)}</span>
                      </div>
                    )}
                  </div>

                  {event.sponsorship_benefits.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sponsorship Benefits</Label>
                      <div className="flex flex-wrap gap-1">
                        {event.sponsorship_benefits.slice(0, 3).map((benefit) => (
                          <Badge key={benefit} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                        {event.sponsorship_benefits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.sponsorship_benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {event.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {event.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.tags.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => handleContactOrg(event)}
                    >
                      Contact Organization
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}