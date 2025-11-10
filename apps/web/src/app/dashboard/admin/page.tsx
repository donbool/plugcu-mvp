'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClientSupabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Organization {
  id: string
  user_id: string
  name: string
  university: string
  status: string
  created_at: string
  member_count: number | null
}

interface Brand {
  id: string
  user_id: string
  company_name: string
  status: string
  created_at: string
  industry: string | null
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orgs' | 'brands'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // For now, just check if user exists (in real app, check admin role)
        // Fetch all users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        setUsers(usersData || [])

        // Fetch all organizations
        const { data: orgsData } = await supabase
          .from('orgs')
          .select('*')
          .order('created_at', { ascending: false })

        setOrgs(orgsData || [])

        // Fetch all brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .order('created_at', { ascending: false })

        setBrands(brandsData || [])
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
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

  const handleStatusChange = async (id: string, table: 'orgs' | 'brands', newStatus: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      if (table === 'orgs') {
        setOrgs(orgs.map(org => org.id === id ? { ...org, status: newStatus } : org))
      } else {
        setBrands(brands.map(brand => brand.id === id ? { ...brand, status: newStatus } : brand))
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrgs = orgs.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.university.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBrands = brands.filter(brand =>
    brand.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="text-center py-8">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, organizations, and brands</p>
        </div>

        {/* Overview Stats */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{users.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{orgs.length}</div>
                <div className="text-sm text-gray-600">Organizations</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">{brands.length}</div>
                <div className="text-sm text-gray-600">Brands</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {orgs.filter(o => o.status === 'pending').length + brands.filter(b => b.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Approvals</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => { setActiveTab('overview'); setSearchTerm('') }}
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchTerm('') }}
            className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => { setActiveTab('orgs'); setSearchTerm('') }}
            className={`px-4 py-2 font-medium ${activeTab === 'orgs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Organizations ({orgs.length})
          </button>
          <button
            onClick={() => { setActiveTab('brands'); setSearchTerm('') }}
            className={`px-4 py-2 font-medium ${activeTab === 'brands' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Brands ({brands.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{user.full_name || '-'}</td>
                          <td className="px-6 py-3 text-sm">
                            <Badge variant="secondary">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'orgs' && (
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="space-y-4">
              {filteredOrgs.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Member Count</p>
                        <p className="font-medium">{org.member_count || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(org.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant={org.status === 'verified' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(org.id, 'orgs', 'verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant={org.status === 'rejected' ? 'destructive' : 'outline'}
                            onClick={() => handleStatusChange(org.id, 'orgs', 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="space-y-4">
              {filteredBrands.map((brand) => (
                <Card key={brand.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{brand.company_name}</CardTitle>
                        <CardDescription>{brand.industry || 'No industry specified'}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(brand.status)}>
                        {brand.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Industry</p>
                        <p className="font-medium">{brand.industry || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(brand.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant={brand.status === 'verified' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(brand.id, 'brands', 'verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant={brand.status === 'rejected' ? 'destructive' : 'outline'}
                            onClick={() => handleStatusChange(brand.id, 'brands', 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
