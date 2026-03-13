'use client'

import { useState } from 'react'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Heart, BookOpen, Calendar, Lock, Plus, Search, MoreHorizontal, UserCheck, MapPin } from 'lucide-react'
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
const MOCK_CLASSES = [
  { id: 1, batch: 'Fall 2023', type: 'Premarital', couples: 5, instructor: 'Pastor Dawit', status: 'In Progress' },
  { id: 2, batch: 'Summer 2023', type: 'Premarital', couples: 4, instructor: 'Pastor Dawit', status: 'Completed' },
]

const MOCK_COUNSELING = [
  { id: 1, id_code: 'C-2023-08', type: 'Marriage', sessions: 3, lastSession: '2023-10-20', status: 'Active' },
  { id: 2, id_code: 'C-2023-12', type: 'Family', sessions: 1, lastSession: '2023-10-24', status: 'Active' },
  { id: 3, id_code: 'C-2023-05', type: 'Individual', sessions: 6, lastSession: '2023-09-15', status: 'Closed' },
]

const MOCK_SEMINARS = [
  { id: 1, title: 'Building Strong Foundations', date: '2023-11-15', attendees: 45, location: 'Main Hall', status: 'Upcoming' },
  { id: 2, title: 'Parenting in Digital Age', date: '2023-09-10', attendees: 60, location: 'Youth Hall', status: 'Completed' },
]

export default function MarriageFamilyPage() {
  const [activeTab, setActiveTab] = useState('classes')

  const metrics = [
    { label: 'Active Couples', value: 9, icon: <Heart className="w-5 h-5" /> },
    { label: 'Counseling Cases', value: 5, icon: <Users className="w-5 h-5" /> },
    { label: 'Seminars (YTD)', value: 4, icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Upcoming Events', value: 1, icon: <Calendar className="w-5 h-5" /> },
  ]

  const tabs = [
    { id: 'classes', label: 'Premarital Classes' },
    { id: 'counseling', label: 'Counseling' },
    { id: 'seminars', label: 'Seminars' },
    { id: 'records', label: 'Confidential Records' },
  ]

  return (
    <MinistryDashboard
      name="Marriage & Family Ministry"
      description="Support marriages and family life through counseling, classes, and seminars"
      icon="💑"
      memberCount={18}
      lastActivity="Counseling session completed"
      metrics={metrics}
      tabs={tabs}
    >
      <Tabs defaultValue="classes" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="classes">Premarital Classes</TabsTrigger>
          <TabsTrigger value="counseling">Counseling</TabsTrigger>
          <TabsTrigger value="seminars">Seminars</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-medium">Class Batches</h3>
             <Button><Plus className="mr-2 h-4 w-4"/> New Batch</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {MOCK_CLASSES.map((cls) => (
               <Card key={cls.id}>
                 <CardHeader className="pb-2">
                   <div className="flex justify-between">
                     <Badge variant={cls.status === 'Completed' ? 'secondary' : 'default'}>{cls.status}</Badge>
                     <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="h-4 w-4"/></Button>
                   </div>
                   <CardTitle className="text-base mt-2">{cls.batch} - {cls.type}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2 text-sm text-muted-foreground">
                     <div className="flex items-center gap-2"><Users className="h-4 w-4"/> {cls.couples} Couples Enrolled</div>
                     <div className="flex items-center gap-2"><UserCheck className="h-4 w-4"/> {cls.instructor}</div>
                   </div>
                   <Button variant="outline" size="sm" className="w-full mt-4">View Class Roster</Button>
                 </CardContent>
               </Card>
             ))}
          </div>
        </TabsContent>

        {/* Counseling Tab */}
        <TabsContent value="counseling" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Input placeholder="Search case ID..." className="w-[300px]" />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Case
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Counseling Sessions</CardTitle>
              <CardDescription>Anonymized counseling case logs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sessions Held</TableHead>
                    <TableHead>Last Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_COUNSELING.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.id_code}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{c.sessions}</TableCell>
                      <TableCell>{c.lastSession}</TableCell>
                      <TableCell>
                         <Badge variant={c.status === 'Active' ? 'default' : 'secondary'}>{c.status}</Badge>
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

        {/* Seminars Tab */}
        <TabsContent value="seminars" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-medium">Family Seminars</h3>
             <Button><Calendar className="mr-2 h-4 w-4"/> Schedule Seminar</Button>
           </div>
           {MOCK_SEMINARS.map((sem) => (
             <div key={sem.id} className="flex items-center justify-between border p-4 rounded-lg mb-4 bg-card">
               <div>
                 <h4 className="font-semibold text-lg">{sem.title}</h4>
                 <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {sem.date}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {sem.attendees} Attendees</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {sem.location}</span>
                 </div>
               </div>
               <div>
                 <Badge variant={sem.status === 'Upcoming' ? 'default' : 'secondary'}>{sem.status}</Badge>
               </div>
             </div>
           ))}
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card className="border-red-100 bg-red-50/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-700">
                <Lock className="h-5 w-5"/>
                <CardTitle>Confidential Records</CardTitle>
              </div>
              <CardDescription>Restricted access area for sensitive counseling notes and family records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Lock className="h-12 w-12 mb-4 opacity-20" />
                <p>Authentication required to view sensitive records.</p>
                <Button variant="outline" className="mt-4 border-red-200 hover:bg-red-50 text-red-700">Verify Access</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MinistryDashboard>
  )
}
