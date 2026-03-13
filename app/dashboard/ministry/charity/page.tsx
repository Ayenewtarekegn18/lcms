'use client'

import { useState } from 'react'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Users, DollarSign, CheckCircle, Plus, Search, MoreHorizontal, FileText, XCircle, AlertTriangle } from 'lucide-react'
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
const MOCK_REQUESTS = [
  { id: 1, applicant: 'Abebe Kebede', type: 'Medical', amount: '5,000 ETB', date: '2023-10-24', status: 'New', urgency: 'High' },
  { id: 2, applicant: 'Sara Tadesse', type: 'Rent Support', amount: '3,500 ETB', date: '2023-10-22', status: 'In Review', urgency: 'Medium' },
  { id: 3, applicant: 'Yonas Alemu', type: 'Food', amount: '1,200 ETB', date: '2023-10-20', status: 'Approved', urgency: 'High' },
]

const MOCK_DISTRIBUTIONS = [
  { id: 1, recipient: 'Yonas Alemu', type: 'Food', amount: '1,200 ETB', date: '2023-10-25', approvedBy: 'Deacon Board' },
  { id: 2, recipient: 'Martha Hailu', type: 'School Fees', amount: '2,000 ETB', date: '2023-10-15', approvedBy: 'Charity Comm.' },
  { id: 3, recipient: 'Tesfaye Bekele', type: 'Medical', amount: '4,500 ETB', date: '2023-10-10', approvedBy: 'Elders' },
]

const MOCK_AUDIT_LOGS = [
  { id: 1, action: 'Approved Request #103', user: 'Admin', date: '2023-10-25 10:30 AM', details: 'Medical aid for Yonas A.' },
  { id: 2, action: 'Distributed Funds', user: 'Finance', date: '2023-10-25 02:15 PM', details: '1,200 ETB disbursed' },
  { id: 3, action: 'Rejected Request #101', user: 'Committee', date: '2023-10-24 04:00 PM', details: 'Insufficient documentation' },
]

export default function CharityPage() {
  const [searchTerm, setSearchTerm] = useState('')
  // const [activeTab, setActiveTab] = useState('requests')

  const metrics = [
    { label: 'Active Cases', value: 8, icon: <Heart className="w-5 h-5" /> },
    { label: 'Beneficiaries', value: 24, icon: <Users className="w-5 h-5" /> },
    { label: 'Total Distributed', value: '12,000 ETB', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Pending Review', value: 3, icon: <AlertTriangle className="w-5 h-5" /> },
  ]

  const tabs = [
    { id: 'requests', label: 'Aid Requests' },
    { id: 'review', label: 'Review Queue' },
    { id: 'distribution', label: 'Distribution' },
    { id: 'audit', label: 'Audit & Reports' },
  ]

  return (
    <MinistryDashboard
      name="Charity Ministry"
      description="Provide aid, manage requests, and track distribution of support"
      icon="❤️"
      memberCount={24}
      lastActivity="Aid distributed today"
      metrics={metrics}
      tabs={tabs}
    >
      {/* Requests Tab */}
      <TabsContent value="requests" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicants..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incoming Aid Requests</CardTitle>
            <CardDescription>Manage and triage new applications for assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REQUESTS.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.applicant}</TableCell>
                    <TableCell>{req.type}</TableCell>
                    <TableCell>{req.amount}</TableCell>
                    <TableCell>{req.date}</TableCell>
                    <TableCell>
                      <Badge variant={req.urgency === 'High' ? 'destructive' : 'secondary'}>{req.urgency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'New' ? 'outline' : req.status === 'Approved' ? 'default' : 'secondary'}>
                        {req.status}
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
                          <DropdownMenuItem>View Application</DropdownMenuItem>
                          <DropdownMenuItem>Move to Review</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
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

      {/* Review Tab */}
      <TabsContent value="review" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Review</CardTitle>
            <CardDescription>Validate documents and approve aid requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_REQUESTS.filter(r => r.status === 'In Review' || r.status === 'New').map((req) => (
                <div key={req.id} className="flex items-start justify-between border p-4 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-lg">{req.applicant}</h4>
                    <p className="text-sm text-muted-foreground">Requesting {req.amount} for {req.type}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">Income Statement: Pending</Badge>
                      <Badge variant="outline">ID Copy: Verified</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
              {MOCK_REQUESTS.filter(r => r.status === 'In Review' || r.status === 'New').length === 0 && (
                <p className="text-center text-muted-foreground py-8">No requests currently pending review.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Distribution Tab */}
      <TabsContent value="distribution" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribution History</CardTitle>
            <CardDescription>Record of all aid provided to beneficiaries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DISTRIBUTIONS.map((dist) => (
                  <TableRow key={dist.id}>
                    <TableCell className="font-medium">{dist.recipient}</TableCell>
                    <TableCell>{dist.type}</TableCell>
                    <TableCell>{dist.amount}</TableCell>
                    <TableCell>{dist.date}</TableCell>
                    <TableCell>{dist.approvedBy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Audit Tab */}
      <TabsContent value="audit" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>System logs for sensitive financial and decision actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_AUDIT_LOGS.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </MinistryDashboard>
  )
}
