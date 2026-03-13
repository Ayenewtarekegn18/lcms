'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Heart, MapPin, FileText, Plus, Search, MoreHorizontal, Phone, Calendar } from 'lucide-react'
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
const MOCK_DEACONS = [
  { id: 1, name: 'Tewodros Assefa', zone: 'Bole', phone: '0911234567', status: 'Active' },
  { id: 2, name: 'Mulugeta Haile', zone: 'Sarbet', phone: '0912345678', status: 'Active' },
  { id: 3, name: 'Aster Bekele', zone: 'Gerji', phone: '0913456789', status: 'On Leave' },
]

const MOCK_VISITS = [
  { id: 1, family: 'Family of Ato Kebede', date: '2023-10-22', type: 'Sickness', visitors: 'Tewodros A.', status: 'Completed' },
  { id: 2, family: 'W/ro Almaz', date: '2023-10-25', type: 'Bereavement', visitors: 'Mulugeta H.', status: 'Scheduled' },
  { id: 3, family: 'New Member Visit', date: '2023-10-28', type: 'Welcome', visitors: 'Aster B.', status: 'Planned' },
]

const MOCK_CASES = [
  { id: 1, title: 'Financial Hardship - Case #102', priority: 'High', assignedTo: 'Tewodros A.', status: 'Open' },
  { id: 2, title: 'Elderly Care Support', priority: 'Medium', assignedTo: 'Mulugeta H.', status: 'Ongoing' },
  { id: 3, title: 'Hospital Logistics', priority: 'High', assignedTo: 'Team A', status: 'Resolved' },
]

export default function DeaconsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('deacons')

  const metrics = [
    { label: 'Active Deacons', value: 15, icon: <Users className="w-5 h-5" /> },
    { label: 'Care Visits (Oct)', value: 34, icon: <Heart className="w-5 h-5" /> },
    { label: 'Active Cases', value: 12, icon: <MapPin className="w-5 h-5" /> },
    { label: 'Pending Reports', value: 3, icon: <FileText className="w-5 h-5" /> },
  ]

  const tabs = [
    { id: 'deacons', label: 'Deacons' },
    { id: 'visits', label: 'Care Visits' },
    { id: 'cases', label: 'Support Cases' },
    { id: 'reports', label: 'Reports' },
  ]

  return (
    <MinistryDashboard
      name="Deacons Ministry"
      description="Pastoral care, logistics, and member support services"
      icon="🙌"
      memberCount={15}
      lastActivity="Pastoral visit last Sunday"
      metrics={metrics}
      tabs={tabs}
    >
      <Tabs defaultValue="deacons" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deacons">Deacons</TabsTrigger>
          <TabsTrigger value="visits">Care Visits</TabsTrigger>
          <TabsTrigger value="cases">Support Cases</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Deacons Tab */}
        <TabsContent value="deacons" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deacons..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Link href="/dashboard/members/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Deacon
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deacons Registry</CardTitle>
              <CardDescription>Manage deacons and their assigned zones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Assigned Zone</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DEACONS.map((deacon) => (
                    <TableRow key={deacon.id}>
                      <TableCell className="font-medium">{deacon.name}</TableCell>
                      <TableCell>{deacon.zone}</TableCell>
                      <TableCell className="flex items-center gap-2">
                         <Phone className="h-3 w-3 text-muted-foreground"/> {deacon.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant={deacon.status === 'Active' ? 'default' : 'secondary'}>
                          {deacon.status}
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
                            <DropdownMenuItem>Assign Zone</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
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

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Input placeholder="Search visits..." className="w-[300px]" />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Log Visit
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Care Visit Log</CardTitle>
              <CardDescription>Track pastoral visits to members.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family/Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Visitors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_VISITS.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">{visit.family}</TableCell>
                      <TableCell>{visit.type}</TableCell>
                      <TableCell>{visit.date}</TableCell>
                      <TableCell>{visit.visitors}</TableCell>
                      <TableCell>
                         <Badge variant={visit.status === 'Completed' ? 'default' : 'outline'}>{visit.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                           <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-medium">Ongoing Support Cases</h3>
             <Button variant="outline">View Closed Cases</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_CASES.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                       <Badge variant={c.priority === 'High' ? 'destructive' : 'secondary'}>{c.priority}</Badge>
                       <Badge variant="outline">{c.status}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">Assigned to: {c.assignedTo}</p>
                     <Button size="sm" className="w-full">View Details</Button>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ministry Reports</CardTitle>
              <CardDescription>Monthly reports and care statistics.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>No reports generated for this month yet.</p>
                <Button variant="secondary" className="mt-4">Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MinistryDashboard>
  )
}
