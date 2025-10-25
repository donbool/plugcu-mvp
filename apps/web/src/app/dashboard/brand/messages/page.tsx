'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'
import type { Thread, Message, Brand } from '@/types'

interface ExtendedThread extends Thread {
  orgs: {
    name: string
    university: string
  }
  events?: {
    title: string
  }
  latest_message?: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count: number
}

interface ExtendedMessage extends Message {
  sender: {
    full_name: string
    role: string
  }
}

export default function BrandMessagesPage() {
  const [threads, setThreads] = useState<ExtendedThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ExtendedThread | null>(null)
  const [messages, setMessages] = useState<ExtendedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get brand profile
      const { data: brandData } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setBrand(brandData)

      if (brandData) {
        await fetchThreads(brandData.id)
      }
      
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const fetchThreads = async (brandId: string) => {
    const { data: threadsData } = await supabase
      .from('threads')
      .select(`
        *,
        orgs(name, university),
        events(title)
      `)
      .eq('brand_id', brandId)
      .order('updated_at', { ascending: false })

    // Get latest message and unread count for each thread
    const threadsWithMetadata = await Promise.all(
      (threadsData || []).map(async (thread) => {
        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count (messages not read by current user)
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .is('read_at', null)
          .neq('sender_id', brandId)

        return {
          ...thread,
          latest_message: latestMessage,
          unread_count: count || 0
        }
      })
    )

    setThreads(threadsWithMetadata)
  }

  const fetchMessages = async (threadId: string) => {
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(full_name, role)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    setMessages(messagesData as ExtendedMessage[] || [])

    // Mark messages as read
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', user.id)
        .is('read_at', null)
    }
  }

  const handleThreadSelect = async (thread: ExtendedThread) => {
    setSelectedThread(thread)
    await fetchMessages(thread.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedThread || !brand) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: selectedThread.id,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) throw error

      // Update thread timestamp
      await supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedThread.id)

      setNewMessage('')
      await fetchMessages(selectedThread.id)
      await fetchThreads(brand.id)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
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
            You need to complete your brand profile to access messaging.
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
      <div className="h-[calc(100vh-200px)] flex gap-6">
        {/* Threads List */}
        <Card className="w-1/3 flex flex-col">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Your conversations with organizations</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {threads.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-gray-600">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start by contacting organizations from the Discover page
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleThreadSelect(thread)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{thread.orgs.name}</h4>
                        <p className="text-xs text-gray-600">{thread.orgs.university}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {thread.unread_count > 0 && (
                          <Badge variant="default" className="text-xs">
                            {thread.unread_count}
                          </Badge>
                        )}
                        {thread.latest_message && (
                          <span className="text-xs text-gray-500">
                            {formatDate(thread.latest_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {thread.events && (
                      <p className="text-xs text-blue-600 mb-1">
                        Re: {thread.events.title}
                      </p>
                    )}
                    
                    {thread.latest_message && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {thread.latest_message.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">{selectedThread.orgs.name}</CardTitle>
                <CardDescription>
                  {selectedThread.orgs.university}
                  {selectedThread.events && ` • ${selectedThread.events.title}`}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isFromBrand = message.sender.role === 'brand'
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromBrand ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isFromBrand
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isFromBrand ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
              
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[80px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="self-end"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                <p className="text-gray-600">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}