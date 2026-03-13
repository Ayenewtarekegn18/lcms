"use client"

import { useState } from "react"
import { 
  Users, 
  BookOpen, 
  Users2, 
  BarChart3,
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar,
  FileText
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
const MOCK_CLASSES = [
  { id: 1, name: "Toddlers (2-4)", teacher: "Sarah Johnson", students: 15, room: "101", time: "09:00 AM" },
  { id: 2, name: "Preschool (5-6)", teacher: "Mike Williams", students: 12, room: "102", time: "09:00 AM" },
  { id: 3, name: "Elementary (7-9)", teacher: "Emily Brown", students: 20, room: "103", time: "10:30 AM" },
  { id: 4, name: "Pre-Teens (10-12)", teacher: "David Miller", students: 18, room: "104", time: "10:30 AM" },
]

const MOCK_ATTENDANCE = [
  { id: 1, date: "2024-02-18", class: "Toddlers (2-4)", present: 14, absent: 1, total: 15 },
  { id: 2, date: "2024-02-18", class: "Preschool (5-6)", present: 10, absent: 2, total: 12 },
  { id: 3, date: "2024-02-18", class: "Elementary (7-9)", present: 19, absent: 1, total: 20 },
]

const MOCK_TEACHERS = [
  { id: 1, name: "Sarah Johnson", role: "Lead Teacher", class: "Toddlers (2-4)", status: "Active" },
  { id: 2, name: "Mike Williams", role: "Teacher", class: "Preschool (5-6)", status: "Active" },
  { id: 3, name: "Emily Brown", role: "Teacher", class: "Elementary (7-9)", status: "Active" },
  { id: 4, name: "Jessica Davis", role: "Assistant", class: "Toddlers (2-4)", status: "On Leave" },
]

const MOCK_CURRICULUM = [
  { id: 1, title: "Noah's Ark", ageGroup: "Toddlers (2-4)", duration: "2 weeks", status: "Current" },
  { id: 2, title: "Fruit of the Spirit", ageGroup: "Elementary (7-9)", duration: "4 weeks", status: "Upcoming" },
  { id: 3, title: "Creation Story", ageGroup: "Preschool (5-6)", duration: "3 weeks", status: "Completed" },
]

export default function ChildrenMinistryPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClasses = MOCK_CLASSES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Children Ministry</h2>
          <p className="text-muted-foreground">
            Manage children classes, teachers, and yearly lesson plans.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {cls.name}
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cls.students} Students</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Teacher: {cls.teacher}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <div className="flex items-center mr-4">
                      <Calendar className="mr-1 h-3 w-3" />
                      {cls.time}
                    </div>
                    <div className="flex items-center">
                      <Users2 className="mr-1 h-3 w-3" />
                      Room {cls.room}
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
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>Recent attendance records by class.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ATTENDANCE.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell className="text-green-600 font-medium">{record.present}</TableCell>
                      <TableCell className="text-red-600 font-medium">{record.absent}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {Math.round((record.present / record.total) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold">Teachers & Staff</h3>
             <Button variant="outline"><Plus className="mr-2 h-4 w-4"/> Add Teacher</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TEACHERS.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{teacher.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.role}</TableCell>
                      <TableCell>{teacher.class}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'Active' ? 'default' : 'secondary'}>
                          {teacher.status}
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
                            <DropdownMenuItem>Edit Assignment</DropdownMenuItem>
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

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold">Lesson Plans</h3>
             <Button variant="outline"><FileText className="mr-2 h-4 w-4"/> Upload Plan</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_CURRICULUM.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <CardDescription>{plan.ageGroup}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{plan.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={
                        plan.status === 'Current' ? 'bg-green-50 text-green-700' : 
                        plan.status === 'Upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                      }>
                        {plan.status}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
