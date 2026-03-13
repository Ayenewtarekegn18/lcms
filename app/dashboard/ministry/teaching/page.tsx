"use client"

import { useState } from "react"
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText,
  Plus, 
  Search, 
  MoreHorizontal, 
  Video,
  CheckSquare
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
const MOCK_COURSES = [
  { id: 1, title: "Foundations of Faith", instructor: "Pastor Yohannes", type: "Course", duration: "6 weeks", status: "Active" },
  { id: 2, title: "Effective Leadership", instructor: "Elder Tesfaye", type: "Seminar", duration: "1 day", status: "Upcoming" },
  { id: 3, title: "Biblical Interpretation", instructor: "Dr. Kebede", type: "Course", duration: "8 weeks", status: "Completed" },
]

const MOCK_PARTICIPANTS = [
  { id: 1, name: "Abebe Kebede", course: "Foundations of Faith", role: "Student", progress: "80%" },
  { id: 2, name: "Sara Tefera", course: "Effective Leadership", role: "Student", progress: "0%" },
  { id: 3, name: "Dawit Alemu", course: "Foundations of Faith", role: "Student", progress: "100%" },
]

const MOCK_MATERIALS = [
  { id: 1, title: "Week 1 Slides", type: "PDF", course: "Foundations of Faith", date: "2024-02-10" },
  { id: 2, title: "Leadership Manual", type: "Document", course: "Effective Leadership", date: "2024-03-01" },
  { id: 3, title: "Seminar Recording", type: "Video", course: "Effective Leadership", date: "2024-03-02" },
]

export default function TeachingMinistryPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCourses = MOCK_COURSES.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teaching & Seminar</h2>
          <p className="text-muted-foreground">
            Organizes doctrinal teaching, seminars, and structured learning programs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Instructor: {course.instructor}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Duration: {course.duration}
                    </div>
                    <div className="mt-4">
                      <Badge variant={course.status === 'Active' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PARTICIPANTS.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.course}</TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell>{p.progress}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold">Teaching Resources</h3>
             <Button variant="outline"><FileText className="mr-2 h-4 w-4"/> Upload Material</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MATERIALS.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {m.type === 'Video' ? <Video className="h-4 w-4"/> : <FileText className="h-4 w-4"/>}
                        {m.title}
                      </TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell>{m.course}</TableCell>
                      <TableCell>{m.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Download</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold">Attendance Tracking</h3>
             <Button variant="outline"><CheckSquare className="mr-2 h-4 w-4"/> Mark Attendance</Button>
          </div>
          <Card>
            <CardContent>
               <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                 <CheckSquare className="h-12 w-12 mb-4 opacity-20" />
                 <p>Select a course to view or mark attendance records.</p>
                 <Button variant="secondary" className="mt-4">Select Course</Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
