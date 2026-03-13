"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock Data
const MOCK_YOUTH_MEMBERS = [
  { id: 1, name: "James Tekle", age: 16, group: "Senior High", joinDate: "2023-05-10", status: "Active", attendance: "90%" },
  { id: 2, name: "Abeba Mesfin", age: 14, group: "Junior High", joinDate: "2023-08-15", status: "Active", attendance: "85%" },
  { id: 3, name: "Dawit Hailu", age: 12, group: "Junior High", joinDate: "2024-01-20", status: "New", attendance: "100%" },
  { id: 4, name: "Saron Tadesse", age: 17, group: "Senior High", joinDate: "2022-11-05", status: "Inactive", attendance: "40%" },
  { id: 5, name: "Yonas Alemu", age: 15, group: "Senior High", joinDate: "2023-03-12", status: "Active", attendance: "95%" },
]

const MOCK_EVENTS = [
  { id: 1, title: "Youth Conference 2024", date: "2024-07-15", location: "Main Hall", attendees: 120, type: "Conference" },
  { id: 2, title: "Bible Study: Romans", date: "2024-06-20", location: "Room 101", attendees: 45, type: "Bible Study" },
  { id: 3, title: "Worship Night", date: "2024-06-25", location: "Chapel", attendees: 80, type: "Worship" },
]

const MOCK_MENTORSHIP = [
  { id: 1, mentor: "Pastor Yohannes", mentee: "James Tekle", startDate: "2024-01-10", status: "Ongoing", topic: "Spiritual Growth" },
  { id: 2, mentor: "Sister Tigist", mentee: "Abeba Mesfin", startDate: "2024-02-15", status: "Ongoing", topic: "Academic Support" },
]

export default function YouthMinistryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  // const [activeTab, setActiveTab] = useState("members")

  const filteredMembers = MOCK_YOUTH_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.group.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Youth Ministry</h2>
          <p className="text-muted-foreground">
            Manage youth members, events, mentorship programs, and reports.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/members/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Youth Directory</CardTitle>
              <CardDescription>
                A list of all registered youth members ({filteredMembers.length} total).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.age}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.group}</Badge>
                      </TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.status === 'Active' ? 'default' : member.status === 'New' ? 'secondary' : 'destructive'}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.attendance}</TableCell>
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
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>Contact Parents</DropdownMenuItem>
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

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Upcoming Events</h3>
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Schedule Event</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_EVENTS.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{event.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {event.attendees} Registered
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mentorship Tab */}
        <TabsContent value="mentorship" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Mentorship Programs</h3>
            <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Assign Mentor</Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Active Mentorships</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Mentee</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MENTORSHIP.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.mentor}</TableCell>
                      <TableCell>{item.mentee}</TableCell>
                      <TableCell>{item.topic}</TableCell>
                      <TableCell>{item.startDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Youth</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
