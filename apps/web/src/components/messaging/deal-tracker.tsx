'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientSupabase } from '@/lib/supabase'

interface DealTrackerProps {
  threadId: string
  userRole: 'brand' | 'student_org'
}

interface Deal {
  id: string
  deal_status: string
  deal_amount?: number
  agreed_benefits: string[]
  sponsor_satisfaction_score?: number
  org_satisfaction_score?: number
}

const DEAL_STATUSES = [
  { value: 'interested', label: 'Interested', color: 'bg-blue-100 text-blue-800' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'agreed', label: 'Agreement Reached', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Event Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
]

export function DealTracker({ threadId, userRole }: DealTrackerProps) {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    status: 'interested',
    amount: '',
    benefits: [] as string[],
    satisfactionScore: ''
  })
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientSupabase()

  useEffect(() => {
    fetchDeal()
  }, [threadId])

  const fetchDeal = async () => {
    try {
      const { data: dealData } = await supabase
        .from('sponsorship_deals')
        .select('*')
        .eq('thread_id', threadId)
        .single()

      setDeal(dealData)
      
      if (dealData) {
        setFormData({
          status: dealData.deal_status,
          amount: dealData.deal_amount?.toString() || '',
          benefits: dealData.agreed_benefits || [],
          satisfactionScore: userRole === 'brand' 
            ? dealData.sponsor_satisfaction_score?.toString() || ''
            : dealData.org_satisfaction_score?.toString() || ''
        })
      }
    } catch (error) {
      // Deal doesn't exist yet
      setDeal(null)
    } finally {
      setLoading(false)
    }
  }

  const updateDealStatus = async (newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Record interaction
      await supabase.from('interactions').insert({
        user_id: user.id,
        action_type: 'deal_update',
        target_type: 'thread',
        target_id: threadId,
        metadata: { 
          old_status: deal?.deal_status || 'none',
          new_status: newStatus
        }
      })

      const updateData = {
        deal_status: newStatus,
        ...(formData.amount && { deal_amount: parseInt(formData.amount) }),
        ...(formData.benefits.length > 0 && { agreed_benefits: formData.benefits })
      }

      if (deal) {
        // Update existing deal
        await supabase
          .from('sponsorship_deals')
          .update(updateData)
          .eq('id', deal.id)
      } else {
        // Create new deal - need to get thread details first
        const { data: threadData } = await supabase
          .from('threads')
          .select('brand_id, org_id, event_id')
          .eq('id', threadId)
          .single()

        if (threadData) {
          await supabase
            .from('sponsorship_deals')
            .insert({
              thread_id: threadId,
              brand_id: threadData.brand_id,
              org_id: threadData.org_id,
              event_id: threadData.event_id,
              ...updateData
            })
        }
      }

      await fetchDeal()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating deal:', error)
      alert('Failed to update deal status')
    }
  }

  const submitSatisfactionScore = async () => {
    if (!deal || !formData.satisfactionScore) return

    try {
      const scoreField = userRole === 'brand' 
        ? 'sponsor_satisfaction_score'
        : 'org_satisfaction_score'

      await supabase
        .from('sponsorship_deals')
        .update({
          [scoreField]: parseInt(formData.satisfactionScore)
        })
        .eq('id', deal.id)

      await fetchDeal()
      alert('Thank you for your feedback!')
    } catch (error) {
      console.error('Error submitting satisfaction score:', error)
      alert('Failed to submit feedback')
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">Loading deal status...</div>
        </CardContent>
      </Card>
    )
  }

  const currentStatus = DEAL_STATUSES.find(s => s.value === (deal?.deal_status || 'interested'))
  const canUpdateDeal = userRole === 'brand' || userRole === 'student_org'
  const showSatisfactionScore = deal?.deal_status === 'completed'

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sponsorship Status</CardTitle>
        <CardDescription>
          Track the progress of this sponsorship opportunity
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className={currentStatus?.color}>
              {currentStatus?.label}
            </Badge>
          </div>
          
          {canUpdateDeal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Update Status'}
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label>Deal Status</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {DEAL_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.status !== 'cancelled' && (
              <>
                <div className="space-y-2">
                  <Label>Deal Amount ($)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agreed Benefits (comma-separated)</Label>
                  <Input
                    value={formData.benefits.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      benefits: e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                    }))}
                    placeholder="Logo placement, social media mention, booth space"
                  />
                </div>
              </>
            )}

            <Button onClick={() => updateDealStatus(formData.status)}>
              Update Deal Status
            </Button>
          </div>
        )}

        {deal && (
          <div className="space-y-3 text-sm">
            {deal.deal_amount && (
              <div>
                <span className="font-medium">Deal Amount: </span>
                <span>${deal.deal_amount.toLocaleString()}</span>
              </div>
            )}
            
            {deal.agreed_benefits.length > 0 && (
              <div>
                <span className="font-medium">Agreed Benefits: </span>
                <span>{deal.agreed_benefits.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {showSatisfactionScore && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <h4 className="font-medium text-blue-900">
              How satisfied were you with this sponsorship?
            </h4>
            <div className="flex items-center gap-3">
              <select
                value={formData.satisfactionScore}
                onChange={(e) => setFormData(prev => ({ ...prev, satisfactionScore: e.target.value }))}
                className="p-2 border border-blue-300 rounded-md"
              >
                <option value="">Rate 1-5</option>
                <option value="1">1 - Very Dissatisfied</option>
                <option value="2">2 - Dissatisfied</option>
                <option value="3">3 - Neutral</option>
                <option value="4">4 - Satisfied</option>
                <option value="5">5 - Very Satisfied</option>
              </select>
              
              <Button
                size="sm"
                onClick={submitSatisfactionScore}
                disabled={!formData.satisfactionScore}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}