'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Brand } from '@/types'

interface MatchData {
  id: string
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
  events: {
    id: string
    title: string
    description: string
    event_date: string | null
    expected_attendance: number | null
    sponsorship_min_amount: number | null
    sponsorship_max_amount: number | null
    tags: string[]
    orgs: {
      name: string
      university: string
    }
  }
  feedback?: {
    feedback_type: string
    feedback_reasons: string[]
  }
}

const FEEDBACK_REASONS = [
  'perfect_fit',
  'good_budget_match',
  'right_audience',
  'good_timing',
  'budget_too_high',
  'budget_too_low',
  'wrong_audience',
  'bad_timing',
  'not_interested'
]

export default function BrandMatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null)
  
  const supabase = createClientSupabase()

  // DISABLED: useEffect hook - all database calls disabled to reduce network requests
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     if (!user) return
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
  //     if (brandData) {
  //       await fetchMatches(brandData.id)
  //     }
  //
  //     setLoading(false)
  //   }
  //
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

        // Get brand profile
        const { data: brandData } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (brandData) {
          setBrand(brandData)
          await fetchMatches(brandData.id)
        }
      } catch (error) {
        console.error('Error loading matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchMatches = async (brandId: string) => {
    try {
      // Disabled: FastAPI endpoint not needed, fetch directly from database
      // const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'
      // const response = await fetch(`${fastApiUrl}/api/v1/matches/${brandId}`, {...})

      // Fetch matches directly from database
      await fetchMatchesFromDB(brandId)
    } catch (error) {
      console.error('Error fetching matches:', error)
      await fetchMatchesFromDB(brandId)
    }
  }

  const fetchMatchesFromDB = async (brandId: string) => {
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        id, score, reasoning,
        events(
          id, title, description, event_date, expected_attendance,
          sponsorship_min_amount, sponsorship_max_amount, tags,
          orgs(name, university)
        )
      `)
      .eq('brand_id', brandId)
      .order('score', { ascending: false })
      .limit(20)

    // Get feedback for each match (disabled - data collection paused)
    const { data: { user } } = await supabase.auth.getUser()
    const enrichedMatches = (matchesData || []).map((match: any) => {
      // const { data: feedbackData } = await supabase
      //   .from('match_feedback')
      //   .select('feedback_type, feedback_reasons')
      //   .eq('match_id', match.id)
      //   .eq('user_id', user?.id)
      //   .single()

      return {
        ...match,
        feedback: null
      }
    })

    setMatches(enrichedMatches)
  }

  const submitFeedback = async (matchId: string, feedbackType: string, reasons: string[] = []) => {
    if (!brand) return

    setFeedbackSubmitting(matchId)
    try {
      // Data collection disabled for now
      // const { data: { user } } = await supabase.auth.getUser()
      // if (!user) throw new Error('Not authenticated')
      //
      // // Record interaction
      // await supabase.from('interactions').insert({
      //   user_id: user.id,
      //   action_type: 'feedback',
      //   target_type: 'match',
      //   target_id: matchId,
      //   metadata: { feedback_type: feedbackType, reasons }
      // })
      //
      // // Upsert feedback
      // const { error } = await supabase
      //   .from('match_feedback')
      //   .upsert({
      //     match_id: matchId,
      //     user_id: user.id,
      //     feedback_type: feedbackType,
      //     feedback_reasons: reasons
      //   })
      //
      // if (error) throw error
      //
      // // Refresh matches to show updated feedback
      // await fetchMatches(brand.id)
      console.log('Feedback submission disabled (data collection paused)')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback')
    } finally {
      setFeedbackSubmitting(null)
    }
  }

  const handleContactOrg = async (match: MatchData) => {
    if (!brand) return

    try {
      // Record interaction (disabled - data collection paused)
      // const { data: { user } } = await supabase.auth.getUser()
      // if (user) {
      //   await supabase.from('interactions').insert({
      //     user_id: user.id,
      //     action_type: 'contact',
      //     target_type: 'event',
      //     target_id: match.events.id,
      //     metadata: {
      //       match_score: match.score,
      //       via: 'matches_page'
      //     }
      //   })
      // }

      // Navigate to discover page to handle contact flow
      window.location.href = `/dashboard/brand/discover`
    } catch (error) {
      console.error('Error recording interaction:', error)
    }
  }

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-blue-600 bg-blue-100'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="brand">
        <div className="text-center py-8">Loading matches...</div>
      </DashboardLayout>
    )
  }

  if (!brand) {
    return (
      <DashboardLayout requiredRole="brand">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">
            You need to complete your brand profile to see match recommendations.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/brand/profile'}>
            Complete Brand Profile
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="brand">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Matches</h1>
            <p className="text-gray-600">Sponsorship opportunities tailored for your brand</p>
          </div>
          <Button variant="outline" onClick={() => fetchMatches(brand.id)}>
            Refresh Matches
          </Button>
        </div>

        {matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
              <p className="text-gray-600 mb-6">
                Complete your brand profile and check back for AI-powered recommendations.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/brand/profile'}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{match.events.title}</CardTitle>
                        <Badge className={`px-3 py-1 ${getScoreColor(match.score)}`}>
                          {formatScore(match.score)} Match
                        </Badge>
                      </div>
                      <CardDescription>
                        <span className="font-medium">{match.events.orgs.name}</span>
                        {' • '}
                        <span>{match.events.orgs.university}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <p className="text-gray-700">{match.events.description}</p>
                  
                  {/* Event Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {match.events.event_date && (
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">
                          {new Date(match.events.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {match.events.expected_attendance && (
                      <div>
                        <span className="text-gray-500">Attendance:</span>
                        <p className="font-medium">{match.events.expected_attendance.toLocaleString()}</p>
                      </div>
                    )}
                    
                    {(match.events.sponsorship_min_amount || match.events.sponsorship_max_amount) && (
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <p className="font-medium">
                          {match.events.sponsorship_min_amount && `$${match.events.sponsorship_min_amount.toLocaleString()}`}
                          {match.events.sponsorship_min_amount && match.events.sponsorship_max_amount && ' - '}
                          {match.events.sponsorship_max_amount && `$${match.events.sponsorship_max_amount.toLocaleString()}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {match.events.tags.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {match.events.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match Reasoning */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Why this is a good match</h4>
                    <p className="text-blue-800 text-sm mb-3">{match.reasoning.explanation}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-blue-600">Interest Alignment:</span>
                        <p className="font-medium">{formatScore(match.reasoning.tag_overlap_score)}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">Budget Fit:</span>
                        <p className="font-medium">{formatScore(match.reasoning.budget_alignment_score)}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">Audience Match:</span>
                        <p className="font-medium">{formatScore(match.reasoning.demographic_match_score)}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">Event Scale:</span>
                        <p className="font-medium">{formatScore(match.reasoning.attendance_score)}</p>
                      </div>
                    </div>

                    {match.reasoning.matched_tags.length > 0 && (
                      <div className="mt-3">
                        <span className="text-blue-600 text-xs">Matched interests: </span>
                        <span className="text-blue-800 text-xs">
                          {match.reasoning.matched_tags.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Section */}
                  <div className="border-t pt-4">
                    {match.feedback ? (
                      <div className="text-sm text-gray-600">
                        <span>✓ You rated this match: </span>
                        <span className="font-medium capitalize">
                          {match.feedback.feedback_type.replace('_', ' ')}
                        </span>
                        {match.feedback.feedback_reasons.length > 0 && (
                          <span> ({match.feedback.feedback_reasons.join(', ')})</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Is this a good match?</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitFeedback(match.id, 'thumbs_up', ['perfect_fit'])}
                            disabled={feedbackSubmitting === match.id}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            👍 Great Match
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitFeedback(match.id, 'thumbs_down', ['not_interested'])}
                            disabled={feedbackSubmitting === match.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            👎 Not Interested
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitFeedback(match.id, 'not_relevant', ['wrong_audience'])}
                            disabled={feedbackSubmitting === match.id}
                          >
                            🤷 Not Relevant
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleContactOrg(match)}
                    >
                      Contact Organization
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Full Details
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