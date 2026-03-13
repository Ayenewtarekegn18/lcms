'use client'

import { useState } from 'react'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  Clock, 
  Heart, 
  MessageCircle, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react'

// Mock Data
const MOCK_GROUPS = [
  {
    id: 'PG-001',
    name: 'Mothers Prayer Group',
    leader: 'Mrs. Almaz',
    schedule: 'Wednesdays 10:00 AM',
    members: 24,
    location: 'Main Sanctuary'
  },
  {
    id: 'PG-002',
    name: 'Youth Intercessors',
    leader: 'Bro. Samuel',
    schedule: 'Fridays 6:00 PM',
    members: 35,
    location: 'Youth Hall'
  },
  {
    id: 'PG-003',
    name: 'Early Morning Watch',
    leader: 'Dcn. Tesfaye',
    schedule: 'Daily 5:00 AM',
    members: 15,
    location: 'Prayer Room'
  }
]

const MOCK_REQUESTS = [
  {
    id: 'REQ-001',
    requestor: 'Sister Helen',
    subject: 'Healing for mother',
    date: '2024-02-08',
    status: 'Active',
    assignedTo: 'Mothers Group',
    urgency: 'High'
  },
  {
    id: 'REQ-002',
    requestor: 'Anonymous',
    subject: 'Job interview',
    date: '2024-02-07',
    status: 'Answered',
    assignedTo: 'Youth Intercessors',
    urgency: 'Medium'
  },
  {
    id: 'REQ-003',
    requestor: 'Bro. Dawit',
    subject: 'Family salvation',
    date: '2024-02-05',
    status: 'Active',
    assignedTo: 'Early Morning Watch',
    urgency: 'Medium'
  }
]

const MOCK_SCHEDULE = [
  { id: 'SCH-001', day: 'Monday', time: '05:00 AM', group: 'Early Morning Watch', location: 'Prayer Room' },
  { id: 'SCH-002', day: 'Tuesday', time: '05:00 AM', group: 'Early Morning Watch', location: 'Prayer Room' },
  { id: 'SCH-003', day: 'Wednesday', time: '10:00 AM', group: 'Mothers Prayer Group', location: 'Main Sanctuary' },
  { id: 'SCH-004', day: 'Friday', time: '06:00 PM', group: 'Youth Intercessors', location: 'Youth Hall' },
]

export default function PrayerGroupsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const metrics = [
    { label: 'Prayer Groups', value: 3, icon: <Users className="w-5 h-5 text-blue-600" /> },
    { label: 'Weekly Meetings', value: 12, icon: <Clock className="w-5 h-5 text-amber-600" /> },
    { label: 'Active Requests', value: 45, icon: <Heart className="w-5 h-5 text-red-600" /> },
    { label: 'Testimonies', value: 18, icon: <MessageCircle className="w-5 h-5 text-green-600" /> },
  ]

  const tabs = [
    { id: 'groups', label: 'Groups' },
    { id: 'requests', label: 'Prayer Requests' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'attendance', label: 'Attendance' },
  ]

  return (
    <MinistryDashboard
      name="Prayer Groups"
      description="Coordinate prayer meetings and spiritual requests"
      icon="🙏"
      memberCount={74}
      lastActivity="Morning prayer held today"
      metrics={metrics}
      tabs={tabs}
    >
      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="requests">Prayer Requests</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Group
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_GROUPS.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                      Active
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Members</DropdownMenuItem>
                        <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-2 text-lg">{group.name}</CardTitle>
                  <CardDescription>Led by {group.leader}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {group.schedule}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> {group.members} Members
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {group.location}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Manage Group
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Prayer Requests</CardTitle>
                  <CardDescription>Manage and assign prayer needs.</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_REQUESTS.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requestor}</TableCell>
                      <TableCell>{req.subject}</TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell>{req.assignedTo}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={req.status === 'Answered' ? 'default' : 'secondary'}
                          className={req.status === 'Answered' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Update</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_SCHEDULE.map((sch) => (
                    <TableRow key={sch.id}>
                      <TableCell className="font-medium">{sch.day}</TableCell>
                      <TableCell>{sch.time}</TableCell>
                      <TableCell>{sch.group}</TableCell>
                      <TableCell>{sch.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-900">Attendance Records</h3>
            <p className="max-w-sm mt-2">Select a group to view or record attendance.</p>
            <Button variant="outline" className="mt-4">
              Select Group
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MinistryDashboard>
  )
}

function MapPin({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
