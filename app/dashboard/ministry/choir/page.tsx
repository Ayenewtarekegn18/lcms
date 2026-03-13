'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Music, Calendar, TrendingUp, Plus, Search, MoreHorizontal, CheckCircle, UserPlus, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock Data
const MOCK_MEMBERS = [
  { id: 1, name: 'Hanna Mekonnen', voice: 'Soprano', status: 'Active', joined: '2021-05-12' },
  { id: 2, name: 'Dawit Tadesse', voice: 'Tenor', status: 'Active', joined: '2020-09-10' },
  { id: 3, name: 'Tigist Alemu', voice: 'Alto', status: 'On Leave', joined: '2022-01-15' },
  { id: 4, name: 'Samson Bekele', voice: 'Bass', status: 'Active', joined: '2019-11-20' },
]

const MOCK_SONGS = [
  { id: 1, title: 'Barekgn', key: 'G Major', composer: 'Yilma H.', type: 'Worship', added: '2023-01-10' },
  { id: 2, title: 'Semayawi', key: 'D Major', composer: 'Choir', type: 'Praise', added: '2023-03-15' },
  { id: 3, title: 'Egzihabher', key: 'E Minor', composer: 'Traditional', type: 'Hymn', added: '2022-11-05' },
]

const MOCK_SCHEDULE = [
  { id: 1, event: 'Sunday Service', date: '2023-10-29', time: '08:30 AM', type: 'Performance', status: 'Upcoming' },
  { id: 2, event: 'Weekly Rehearsal', date: '2023-10-27', time: '05:30 PM', type: 'Rehearsal', status: 'Scheduled' },
  { id: 3, event: 'Special Program', date: '2023-11-05', time: '02:00 PM', type: 'Performance', status: 'Planning' },
]

export default function ChoirPage() {
  const [searchTerm, setSearchTerm] = useState('')
  // const [activeTab, setActiveTab] = useState('members')

  const metrics = [
    { label: 'Choir Members', value: 42, icon: <Users className="w-5 h-5" /> },
    { label: 'Songs in Library', value: 156, icon: <Music className="w-5 h-5" /> },
    { label: 'Performances', value: 18, icon: <Calendar className="w-5 h-5" /> },
    { label: 'Avg. Attendance', value: '85%', icon: <TrendingUp className="w-5 h-5" /> },
  ]

  const tabs = [
    { id: 'members', label: 'Members' },
    { id: 'library', label: 'Song Library' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'attendance', label: 'Attendance' },
  ]

  return (
    <MinistryDashboard
      name="Neftalem Choir"
      description="Manage choir operations, rehearsals, and performances"
      icon="🎵"
      memberCount={42}
      lastActivity="Rehearsal held on Friday"
      metrics={metrics}
      tabs={tabs}
    >
      {/* Members Tab */}
      <TabsContent value="members" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Link href="/dashboard/members/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choir Registry</CardTitle>
            <CardDescription>Manage active choir members and their voice parts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Voice Part</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MEMBERS.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.voice}</Badge>
                    </TableCell>
                    <TableCell>{member.joined}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Library Tab */}
      <TabsContent value="library" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Input placeholder="Search songs..." className="w-[300px]" />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Song
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Song Repertoire</CardTitle>
            <CardDescription>Digital library of choir songs and lyrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Composer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Lyrics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_SONGS.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell>{song.key}</TableCell>
                    <TableCell>{song.composer}</TableCell>
                    <TableCell>{song.type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Upcoming Events</h3>
          <Button><Calendar className="mr-2 h-4 w-4" /> Schedule Event</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_SCHEDULE.map((evt) => (
            <Card key={evt.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <Badge variant={evt.type === 'Performance' ? 'default' : 'secondary'}>{evt.type}</Badge>
                  <span className="text-sm text-muted-foreground">{evt.status}</span>
                </div>
                <CardTitle className="text-lg mt-2">{evt.event}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {evt.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" /> {evt.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Attendance Tab */}
      <TabsContent value="attendance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Tracking</CardTitle>
            <CardDescription>Monitor member participation in rehearsals and services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a past event to view or mark attendance.</p>
              <Button variant="secondary" className="mt-4">Select Event</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </MinistryDashboard>
  )
}
