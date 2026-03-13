'use client'

import { useState } from 'react'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, CheckCircle, AlertCircle, Plus, Search, Calendar, MoreHorizontal, Download, Trash, Edit, ExternalLink, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock Data
const MOCK_MEETINGS = [
  { id: 1, title: 'Weekly Staff Meeting', date: '2023-10-24', time: '10:00 AM', location: 'Conference Room A', attendees: 12, status: 'Scheduled' },
  { id: 2, title: 'Elders Board Review', date: '2023-10-26', time: '06:00 PM', location: 'Main Office', attendees: 8, status: 'Scheduled' },
  { id: 3, title: 'Ministry Leaders Sync', date: '2023-10-20', time: '02:00 PM', location: 'Hall B', attendees: 15, status: 'Completed' },
  { id: 4, title: 'Quarterly Planning', date: '2023-11-01', time: '09:00 AM', location: 'Retreat Center', attendees: 25, status: 'Planned' },
]

const MOCK_DOCUMENTS = [
  { id: 1, name: 'Church Constitution.pdf', category: 'Policy', uploadedBy: 'Admin', date: '2023-01-15', size: '2.4 MB' },
  { id: 2, name: 'Staff Handbook 2023.pdf', category: 'Policy', uploadedBy: 'HR', date: '2023-02-10', size: '1.8 MB' },
  { id: 3, name: 'Meeting Minutes - Oct 20.docx', category: 'Minutes', uploadedBy: 'Secretary', date: '2023-10-21', size: '450 KB' },
  { id: 4, name: 'Expense Request Form.xlsx', category: 'Template', uploadedBy: 'Finance', date: '2023-03-05', size: '120 KB' },
]

const MOCK_TASKS = [
  { id: 1, title: 'Prepare Annual Report', assignee: 'Sarah J.', due: '2023-11-15', priority: 'High', status: 'In Progress' },
  { id: 2, title: 'Update Website Content', assignee: 'David M.', due: '2023-10-30', priority: 'Medium', status: 'Pending' },
  { id: 3, title: 'Organize File Cabinet', assignee: 'Volunteer', due: '2023-10-28', priority: 'Low', status: 'Completed' },
  { id: 4, title: 'Review Insurance Policy', assignee: 'Board', due: '2023-11-01', priority: 'High', status: 'Pending' },
]

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: 'Special Service This Sunday', channel: 'All Channels', date: '2023-10-25', status: 'Scheduled' },
  { id: 2, title: 'Youth Camp Registration', channel: 'Bulletin', date: '2023-10-22', status: 'Active' },
  { id: 3, title: 'Building Maintenance Notice', channel: 'Internal Email', date: '2023-10-20', status: 'Sent' },
]

export default function AdministrationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  // const [activeTab, setActiveTab] = useState('meetings')

  const metrics = [
    { label: 'Staff Members', value: 12, icon: <Users className="w-5 h-5" /> },
    { label: 'Documents', value: 156, icon: <FileText className="w-5 h-5" /> },
    { label: 'Completed Tasks', value: 89, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Pending Items', value: 14, icon: <AlertCircle className="w-5 h-5" /> },
  ]

  const tabs = [
    { id: 'meetings', label: 'Meetings' },
    { id: 'documents', label: 'Documents' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'announcements', label: 'Announcements' },
  ]

  return (
    <MinistryDashboard
      name="Administration Ministry"
      description="Handle organizational operations, documentation, and communications"
      icon="📋"
      memberCount={12}
      lastActivity="Staff meeting held yesterday"
      metrics={metrics}
      tabs={tabs}
    >
      {/* Meetings Tab */}
      <TabsContent value="meetings" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Meetings</CardTitle>
            <CardDescription>Manage upcoming and past organizational meetings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MEETINGS.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{meeting.date}</span>
                        <span className="text-xs text-muted-foreground">{meeting.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>{meeting.location}</TableCell>
                    <TableCell>{meeting.attendees}</TableCell>
                    <TableCell>
                      <Badge variant={meeting.status === 'Completed' ? 'default' : meeting.status === 'Scheduled' ? 'secondary' : 'outline'}>
                        {meeting.status}
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Add Minutes</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
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

      {/* Documents Tab */}
      <TabsContent value="documents" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy & Document Repository</CardTitle>
            <CardDescription>Centralized storage for church policies, minutes, and templates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DOCUMENTS.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {doc.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell>{doc.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tasks Tab */}
      <TabsContent value="tasks" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Task Management</h3>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_TASKS.map((task) => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
                <CardTitle className="text-sm font-medium mt-2">{task.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{task.assignee.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {task.due}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant={task.status === 'Completed' ? 'default' : 'outline'} className="w-full justify-center">
                    {task.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Announcements Tab */}
      <TabsContent value="announcements" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search announcements..."
              className="w-[300px]"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Announcement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Central Announcements</CardTitle>
            <CardDescription>Manage bulletins, SMS, and email blasts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ANNOUNCEMENTS.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell className="font-medium">{ann.title}</TableCell>
                    <TableCell>{ann.channel}</TableCell>
                    <TableCell>{ann.date}</TableCell>
                    <TableCell>
                      <Badge variant={ann.status === 'Sent' ? 'default' : 'secondary'}>{ann.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </TableCell>
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
