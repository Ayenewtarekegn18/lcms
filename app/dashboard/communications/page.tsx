'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, MessageSquare, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface AnnouncementRow {
  id: string
  title: string
  content: string
  date: string
  author: string
  recipients: string
  status: string
  views: number
}

export default function CommunicationsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string; title?: string; body: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('announcements')

  const [composedMessage, setComposedMessage] = useState({
    title: '',
    content: '',
    recipients: 'All Members',
    channels: ['Email'] as string[],
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchTemplates()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(
          (data || []).map((a: { id: string; title: string; content: string; created_at: string; author_name?: string; recipients?: string; status?: string; views?: number }) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: a.created_at?.split('T')[0] ?? '',
            author: a.author_name ?? 'Unknown',
            recipients: a.recipients ?? 'All Members',
            status: a.status ?? 'Published',
            views: a.views ?? 0,
          }))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  )

  const handlePublish = async () => {
    if (!composedMessage.title?.trim() || !composedMessage.content?.trim()) return
    setPublishing(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composedMessage),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      setComposedMessage({ title: '', content: '', recipients: 'All Members', channels: ['Email'] })
      setActiveTab('announcements')
      fetchAnnouncements()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to publish announcement')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Communications</h1>
        <p className="text-slate-500 mt-2">Send announcements and manage member communications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{announcements.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {announcements.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {announcements.filter((a) => {
                      const date = new Date(a.date)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return date >= weekAgo
                    }).length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {announcements.filter((a) => a.status === 'Published').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Announcements List */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Announcements</CardTitle>
                    <CardDescription>Recent announcements sent to members</CardDescription>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setActiveTab('compose')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search announcements..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <p className="text-slate-500 py-8 text-center">Loading announcements...</p>
                  ) : filteredAnnouncements.length === 0 ? (
                    <p className="text-slate-500 py-8 text-center">No announcements yet. Compose one to get started.</p>
                  ) : (
                  filteredAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{announcement.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span>By {announcement.author}</span>
                            <span>•</span>
                            <span>{new Date(announcement.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{announcement.recipients}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          Published
                        </span>
                      </div>

                      <p className="text-slate-600 mb-4 line-clamp-2">{announcement.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {announcement.views} views
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {Math.floor(announcement.views * 0.15)} responses
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compose">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Compose Announcement</CardTitle>
              <CardDescription>Create and send an announcement to members</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handlePublish()
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Title</label>
                  <Input
                    placeholder="Announcement title"
                    value={composedMessage.title}
                    onChange={(e) =>
                      setComposedMessage({ ...composedMessage, title: e.target.value })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Content</label>
                  <textarea
                    placeholder="Write your announcement here..."
                    value={composedMessage.content}
                    onChange={(e) =>
                      setComposedMessage({ ...composedMessage, content: e.target.value })
                    }
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Send To
                    </label>
                    <select
                      value={composedMessage.recipients}
                      onChange={(e) =>
                        setComposedMessage({
                          ...composedMessage,
                          recipients: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option>All Members</option>
                      <option>Youth Ministry</option>
                      <option>Women's Ministry</option>
                      <option>Prayer Groups</option>
                      <option>Staff Only</option>
                      <option>Leadership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Channels
                    </label>
                    <div className="flex gap-4">
                      {['Email', 'SMS', 'App'].map((channel) => (
                        <label key={channel} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={composedMessage.channels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setComposedMessage({
                                  ...composedMessage,
                                  channels: [...composedMessage.channels, channel],
                                })
                              } else {
                                setComposedMessage({
                                  ...composedMessage,
                                  channels: composedMessage.channels.filter((c) => c !== channel),
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-600">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="submit" disabled={publishing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Send className="w-4 h-4 mr-2" />
                    {publishing ? 'Publishing...' : 'Publish Announcement'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Message Templates</CardTitle>
              <CardDescription>Saved templates for recurring announcements. Use a template to fill the Compose form.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.length === 0 ? (
                  <p className="text-slate-500 col-span-2 py-8 text-center">No templates saved yet. Publish an announcement and save it as a template later, or add one via API.</p>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id} className="bg-slate-50 border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-2">{template.name}</h3>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.body}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300 bg-transparent"
                          onClick={() => {
                            setComposedMessage((p) => ({
                              ...p,
                              title: template.title || template.name,
                              content: template.body,
                            }))
                            setActiveTab('compose')
                          }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
