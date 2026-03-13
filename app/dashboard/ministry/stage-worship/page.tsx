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
  Calendar, 
  Zap, 
  Music, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mic, 
  Speaker,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

// Mock Data
const MOCK_SERVICES = [
  {
    id: 'SVC-001',
    name: 'Sunday Main Service',
    date: '2024-02-11',
    time: '09:00 AM',
    theme: 'Grace Abounds',
    worshipLeader: 'Dcn. Yonas',
    status: 'Upcoming'
  },
  {
    id: 'SVC-002',
    name: 'Youth Service',
    date: '2024-02-09',
    time: '05:00 PM',
    theme: 'Identity in Christ',
    worshipLeader: 'Sis. Bethel',
    status: 'Upcoming'
  },
  {
    id: 'SVC-003',
    name: 'Midweek Service',
    date: '2024-02-07',
    time: '06:00 PM',
    theme: 'Prayer & Fasting',
    worshipLeader: 'Bro. Natnael',
    status: 'Completed'
  }
]

const MOCK_TEAMS = [
  { id: 'TM-001', name: 'Yonas T.', role: 'Worship Leader', team: 'Team A', status: 'Active' },
  { id: 'TM-002', name: 'Bethel A.', role: 'Vocalist', team: 'Team A', status: 'Active' },
  { id: 'TM-003', name: 'Natnael G.', role: 'Keyboardist', team: 'Team B', status: 'Active' },
  { id: 'TM-004', name: 'Robel M.', role: 'Sound Engineer', team: 'Tech', status: 'On Leave' },
  { id: 'TM-005', name: 'Sara K.', role: 'Visuals', team: 'Tech', status: 'Active' },
]

const MOCK_EQUIPMENT = [
  { id: 'EQ-001', item: 'Yamaha Montage 8', category: 'Instrument', condition: 'Good', assignedTo: 'Main Sanctuary' },
  { id: 'EQ-002', item: 'Shure SM58 (x4)', category: 'Audio', condition: 'Good', assignedTo: 'Stage' },
  { id: 'EQ-003', item: 'Behringer X32', category: 'Mixer', condition: 'Needs Service', assignedTo: 'Sound Booth' },
  { id: 'EQ-004', item: 'Drum Kit', category: 'Instrument', condition: 'Fair', assignedTo: 'Stage' },
]

const MOCK_REHEARSALS = [
  { id: 'RH-001', team: 'Team A', day: 'Saturday', time: '02:00 PM', location: 'Main Sanctuary', upcoming: '2024-02-10' },
  { id: 'RH-002', team: 'Team B', day: 'Thursday', time: '06:00 PM', location: 'Rehearsal Room', upcoming: '2024-02-08' },
  { id: 'RH-003', team: 'Choir', day: 'Friday', time: '05:00 PM', location: 'Main Sanctuary', upcoming: '2024-02-09' },
]

export default function StageWorshipPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const metrics = [
    { label: 'Team Members', value: 35, icon: <Users className="w-5 h-5 text-blue-600" /> },
    { label: 'Services/Month', value: 8, icon: <Calendar className="w-5 h-5 text-green-600" /> },
    { label: 'Equipment Items', value: 42, icon: <Zap className="w-5 h-5 text-amber-600" /> },
    { label: 'Rehearsals/Week', value: 12, icon: <Music className="w-5 h-5 text-purple-600" /> },
  ]

  const tabs = [
    { id: 'schedule', label: 'Service Schedule' },
    { id: 'teams', label: 'Teams' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'rehearsal', label: 'Rehearsals' },
  ]

  return (
    <MinistryDashboard
      name="Stage & Worship Ministry"
      description="Manage worship services and stage operations"
      icon="🎶"
      memberCount={35}
      lastActivity="Last Sunday's service - 450 attendees"
      metrics={metrics}
      tabs={tabs}
    >
      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">Service Schedule</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="rehearsal">Rehearsals</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Plan Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_SERVICES.map((svc) => (
              <Card key={svc.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={svc.status === 'Upcoming' ? 'default' : 'secondary'}>
                      {svc.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Plan</DropdownMenuItem>
                        <DropdownMenuItem>View Run Sheet</DropdownMenuItem>
                        <DropdownMenuItem>Team Notification</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-2 text-lg">{svc.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {svc.date} • {svc.time}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Theme:</span>
                      <span className="font-medium">{svc.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Leader:</span>
                      <span className="font-medium">{svc.worshipLeader}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ministry Team</CardTitle>
              <CardDescription>Manage musicians, vocalists, and technical staff.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TEAMS.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.team}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'Active' ? 'outline' : 'secondary'} className={member.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Equipment Inventory</CardTitle>
                  <CardDescription>Track instruments and technical gear.</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_EQUIPMENT.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {item.category === 'Instrument' ? <Music className="h-4 w-4 text-muted-foreground" /> : <Speaker className="h-4 w-4 text-muted-foreground" />}
                        {item.item}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.assignedTo}</TableCell>
                      <TableCell>
                        <Badge variant={item.condition === 'Good' ? 'outline' : 'destructive'} className={item.condition === 'Good' ? 'text-green-600 border-green-200' : ''}>
                          {item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rehearsal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rehearsal Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_REHEARSALS.map((reh) => (
                  <div key={reh.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <Music className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{reh.team} Rehearsal</h4>
                        <p className="text-sm text-muted-foreground">
                          {reh.day}s at {reh.time} • {reh.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Next: {reh.upcoming}</p>
                      <Button variant="link" className="h-auto p-0 text-xs">Notify Team</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MinistryDashboard>
  )
}
