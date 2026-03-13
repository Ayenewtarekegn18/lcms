'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Users, DollarSign, Calendar, TrendingUp, Search, Plus, MoreHorizontal, FileText, Download, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock Data
const MOCK_BENEFICIARIES = [
  { id: 1, name: "Tesfaye Bekele", role: "Evangelist", dependents: 4, monthlyAid: 5000, status: "Active", startDate: "2023-01-15" },
  { id: 2, name: "Aster Mengistu", role: "Cleaner", dependents: 2, monthlyAid: 3500, status: "Active", startDate: "2022-06-10" },
  { id: 3, name: "Yared Tadesse", role: "Guard", dependents: 3, monthlyAid: 3500, status: "Active", startDate: "2023-03-01" },
  { id: 4, name: "Mulugeta Alemu", role: "Retired Pastor", dependents: 2, monthlyAid: 6000, status: "Active", startDate: "2021-09-20" },
  { id: 5, name: "Genet Hailu", role: "Office Assistant", dependents: 1, monthlyAid: 4000, status: "Paused", startDate: "2023-05-15" },
]

const MOCK_DISBURSEMENTS = [
  { id: 1, month: "October 2023", beneficiary: "Tesfaye Bekele", amount: 5000, date: "2023-10-28", status: "Paid", method: "Bank Transfer" },
  { id: 2, month: "October 2023", beneficiary: "Aster Mengistu", amount: 3500, date: "2023-10-28", status: "Paid", method: "Cash" },
  { id: 3, month: "October 2023", beneficiary: "Yared Tadesse", amount: 3500, date: "2023-10-29", status: "Paid", method: "Cash" },
  { id: 4, month: "October 2023", beneficiary: "Mulugeta Alemu", amount: 6000, date: "2023-10-28", status: "Pending", method: "Bank Transfer" },
]

export default function WorkersAidPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const metrics = [
    { label: 'Total Beneficiaries', value: 24, icon: <Users className="w-5 h-5 text-blue-600" /> },
    { label: 'Monthly Budget', value: '120,000 ETB', icon: <Wallet className="w-5 h-5 text-green-600" /> },
    { label: 'Last Month Disbursed', value: '115,500 ETB', icon: <DollarSign className="w-5 h-5 text-yellow-600" /> },
    { label: 'Pending Payments', value: 3, icon: <Calendar className="w-5 h-5 text-purple-600" /> },
  ]

  const tabs = [
    { id: 'beneficiaries', label: 'Beneficiaries' },
    { id: 'disbursements', label: 'Disbursements' },
    { id: 'reports', label: 'Financial Reports' },
  ]

  const filteredBeneficiaries = MOCK_BENEFICIARIES.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MinistryDashboard
      name="Monthly Workers Aid"
      description="Manage regular aid to church workers, disbursements, and financial reporting"
      icon="🤝"
      memberCount={24}
      lastActivity="October disbursement processing"
      metrics={metrics}
      tabs={tabs}
    >
      {/* BENEFICIARIES TAB */}
      <TabsContent value="beneficiaries" className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search beneficiaries..."
                className="pl-8 w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Link href="/dashboard/members/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Beneficiary
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Beneficiary Registry</CardTitle>
            <CardDescription>List of all church workers receiving monthly aid.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dependents</TableHead>
                  <TableHead>Monthly Aid</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeneficiaries.map((beneficiary) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{beneficiary.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {beneficiary.name}
                      </div>
                    </TableCell>
                    <TableCell>{beneficiary.role}</TableCell>
                    <TableCell>{beneficiary.dependents}</TableCell>
                    <TableCell>{beneficiary.monthlyAid.toLocaleString()} ETB</TableCell>
                    <TableCell>{beneficiary.startDate}</TableCell>
                    <TableCell>
                      <Badge variant={beneficiary.status === 'Active' ? 'default' : 'secondary'}>
                        {beneficiary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Amount</DropdownMenuItem>
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

      {/* DISBURSEMENTS TAB */}
      <TabsContent value="disbursements" className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
           <h3 className="text-lg font-medium">Disbursement History</h3>
           <Button>
            <Plus className="mr-2 h-4 w-4" /> Process New Disbursement
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Disbursements</CardTitle>
            <CardDescription>Record of monthly aid payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DISBURSEMENTS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.month}</TableCell>
                    <TableCell>{item.beneficiary}</TableCell>
                    <TableCell>{item.amount.toLocaleString()} ETB</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Paid' ? 'default' : 'outline'}>
                        {item.status}
                      </Badge>
                    </TableCell>
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

      {/* REPORTS TAB */}
      <TabsContent value="reports" className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>YTD Total Aid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,150,000 ETB</div>
              <p className="text-sm text-muted-foreground mt-2">+5% from last year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Average Monthly Aid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">115,000 ETB</div>
              <p className="text-sm text-muted-foreground mt-2">Based on last 10 months</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Projected Annual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,380,000 ETB</div>
              <p className="text-sm text-muted-foreground mt-2">Within budget</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 flex justify-end">
           <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Annual Report
          </Button>
        </div>
      </TabsContent>
    </MinistryDashboard>
  )
}
