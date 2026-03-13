'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface Facility {
  id: string
  facility_name: string
  type: string
  capacity: number
  manager: string
  status: string
  maintenance_notes: string
  created_at: string
}

const FACILITY_TYPES = ['Sanctuary', 'Fellowship Hall', 'Classroom', 'Office', 'Kitchen', 'Parking', 'Other']
const STATUS_OPTIONS = ['active', 'maintenance', 'inactive']

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    facility_name: '',
    type: '',
    capacity: 0,
    manager: '',
    status: 'active',
    maintenance_notes: '',
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

  async function fetchFacilities() {
    try {
      const response = await fetch('/api/facilities')
      if (response.ok) {
        const data = await response.json()
        setFacilities(data)
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/facilities', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          facility_name: '',
          type: '',
          capacity: 0,
          manager: '',
          status: 'active',
          maintenance_notes: '',
        })
        setEditingId(null)
        setOpen(false)
        await fetchFacilities()
      }
    } catch (error) {
      console.error('Error saving facility:', error)
    }
  }

  function handleEdit(facility: Facility) {
    setFormData({
      facility_name: facility.facility_name,
      type: facility.type,
      capacity: facility.capacity,
      manager: facility.manager,
      status: facility.status,
      maintenance_notes: facility.maintenance_notes,
    })
    setEditingId(facility.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure?')) {
      try {
        const response = await fetch(`/api/facilities?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchFacilities()
        }
      } catch (error) {
        console.error('Error deleting facility:', error)
      }
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facility Management</h1>
          <p className="text-muted-foreground mt-2">Manage church buildings and facilities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  facility_name: '',
                  type: '',
                  capacity: 0,
                  manager: '',
                  status: 'active',
                  maintenance_notes: '',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Facility' : 'Add Facility'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update facility details' : 'Add a new facility'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name</Label>
                <Input
                  id="name"
                  value={formData.facility_name}
                  onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
                  placeholder="e.g., Main Sanctuary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v) =>
                  setFormData({ ...formData, type: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="Facility manager name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) =>
                  setFormData({ ...formData, status: v })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance">Maintenance Notes</Label>
                <Textarea
                  id="maintenance"
                  value={formData.maintenance_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenance_notes: e.target.value })
                  }
                  placeholder="Notes"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {facilities.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No facilities yet.
            </CardContent>
          </Card>
        ) : (
          facilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{facility.facility_name}</CardTitle>
                    <CardDescription>{facility.type}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      facility.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : facility.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Capacity: </span>
                    <span>{facility.capacity} people</span>
                  </div>
                  {facility.manager && (
                    <div>
                      <span className="text-muted-foreground">Manager: </span>
                      <span>{facility.manager}</span>
                    </div>
                  )}
                </div>
                {facility.maintenance_notes && (
                  <p className="text-sm text-muted-foreground">{facility.maintenance_notes}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(facility)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(facility.id)}
                    className="gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
