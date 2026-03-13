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
  Globe, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Search, 
  Plus, 
  MoreHorizontal, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

// Mock Data
const MOCK_TRIPS = [
  {
    id: 'TR-2024-001',
    location: 'Hawassa, Sidama',
    dates: '2024-04-10 to 2024-04-15',
    leader: 'Ev. Daniel Kebede',
    participants: 18,
    status: 'Completed',
    budget: 45000,
    outcome: '150 reached, 25 salvations'
  },
  {
    id: 'TR-2024-002',
    location: 'Adama, Oromia',
    dates: '2024-06-20 to 2024-06-25',
    leader: 'Ev. Sarah Abraham',
    participants: 12,
    status: 'Planned',
    budget: 30000,
    outcome: 'Preparation phase'
  },
  {
    id: 'TR-2024-003',
    location: 'Debre Zeit',
    dates: '2024-08-05 to 2024-08-10',
    leader: 'Pst. Yohannes',
    participants: 25,
    status: 'Planned',
    budget: 55000,
    outcome: 'Fundraising active'
  }
]

const MOCK_PARTICIPANTS = [
  { id: 'P001', name: 'Abebe Bikila', role: 'Evangelist', trip: 'Hawassa', status: 'Confirmed' },
  { id: 'P002', name: 'Sara Tadesse', role: 'Logistics', trip: 'Hawassa', status: 'Confirmed' },
  { id: 'P003', name: 'Kebede Michael', role: 'Medical', trip: 'Adama', status: 'Pending' },
  { id: 'P004', name: 'Almaz Ayana', role: 'Worship', trip: 'Adama', status: 'Confirmed' },
  { id: 'P005', name: 'Haile Gebrselassie', role: 'Driver', trip: 'Debre Zeit', status: 'Interest Expressed' },
]

const MOCK_REPORTS = [
  { id: 'Rpt-001', title: 'Hawassa Outreach Summary', date: '2024-04-20', author: 'Ev. Daniel', type: 'Field Report' },
  { id: 'Rpt-002', title: 'Q1 Mission Budget Review', date: '2024-03-31', author: 'Finance Team', type: 'Financial' },
  { id: 'Rpt-003', title: 'Adama Pre-visit Assessment', date: '2024-05-15', author: 'Ev. Sarah', type: 'Planning' },
]

export default function MissionMinistryPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const metrics = [
    { label: 'Active Members', value: 23, icon: <Users className="w-5 h-5 text-blue-600" /> },
    { label: 'Trips Organized', value: 4, icon: <Globe className="w-5 h-5 text-green-600" /> },
    { label: 'Locations', value: 12, icon: <MapPin className="w-5 h-5 text-red-600" /> },
    { label: 'Budget Allocated', value: '130,000 ETB', icon: <DollarSign className="w-5 h-5 text-amber-600" /> },
  ]

  const tabs = [
    { id: 'trips', label: 'Mission Trips' },
    { id: 'participants', label: 'Participants' },
    { id: 'reports', label: 'Reports' },
    { id: 'finance', label: 'Finance' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 hover:bg-green-100/80'
      case 'Planned': return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80'
      case 'Ongoing': return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80'
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-100/80'
    }
  }

  return (
    <MinistryDashboard
      name="Mission Ministry"
      description="Manage outreach, evangelism, and mission activities"
      icon="🌍"
      memberCount={23}
      lastActivity="Last trip - 18 participants"
      metrics={metrics}
      tabs={tabs}
    >
      <Tabs defaultValue="trips" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trips">Mission Trips</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Plan New Trip
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_TRIPS.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-3">
                  <div className="flex justify-between items-start">
                    <Badge className={getStatusColor(trip.status)} variant="secondary">
                      {trip.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Trip</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Cancel Trip</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-2 text-lg">{trip.location}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {trip.dates}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Leader:</span>
                      <span className="font-medium">{trip.leader}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participants:</span>
                      <span className="font-medium">{trip.participants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{trip.budget.toLocaleString()} ETB</span>
                    </div>
                    {trip.outcome && (
                      <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">
                        <strong>Outcome:</strong> {trip.outcome}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip Participants</CardTitle>
              <CardDescription>Manage volunteers and assign roles for upcoming missions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PARTICIPANTS.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell>{p.trip}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Confirmed' ? 'default' : 'secondary'}>
                          {p.status}
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

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission Reports</CardTitle>
              <CardDescription>Field reports, impact assessments, and planning documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_REPORTS.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.date} • {report.author}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Allocated (2024)</span>
                    <span className="text-lg font-bold">500,000 ETB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">Utilized</span>
                    <span className="text-lg font-bold text-green-600">130,000 ETB</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[26%]"></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">26% utilized</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex justify-between text-sm">
                    <span>Transport - Hawassa Trip</span>
                    <span className="font-medium">15,000 ETB</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Accommodation - Hawassa</span>
                    <span className="font-medium">20,000 ETB</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Outreach Materials</span>
                    <span className="font-medium">5,000 ETB</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MinistryDashboard>
  )
}
