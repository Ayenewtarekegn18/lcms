'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, File, Search, Download, Lock, Trash2 } from 'lucide-react'

interface DocRow {
  id: string
  name: string
  category: string | null
  file_size_bytes: number | null
  created_at: string
  access_level: string
  content_type?: string
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeTab, setActiveTab] = useState('documents')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'Meetings',
    access_level: 'Staff Only',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const categories = ['All', 'Meetings', 'Policies', 'Reports', 'Financial', 'Directory', 'Certificates']

  useEffect(() => {
    fetchDocs()
  }, [selectedCategory, search])

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/documents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !search.trim() || doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`)
      if (!res.ok) throw new Error('Failed to get download link')
      const data = await res.json()
      if (data.downloadUrl) window.open(data.downloadUrl, '_blank')
      else alert('Download not available')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = selectedFile || (fileInputRef.current?.files?.[0])
    if (!file) {
      alert('Please select a file')
      return
    }
    if (!uploadForm.name.trim()) {
      alert('Please enter a document name')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('name', uploadForm.name.trim())
      formData.set('category', uploadForm.category)
      formData.set('access_level', uploadForm.access_level)
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      setUploadForm({ name: '', category: 'Meetings', access_level: 'Staff Only' })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setActiveTab('documents')
      fetchDocs()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getAccessColor = (access: string) => {
    switch (access) {
      case 'Public':
        return 'bg-green-100 text-green-800'
      case 'Staff Only':
        return 'bg-amber-100 text-amber-800'
      case 'Leadership Only':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Document Archive</h1>
        <p className="text-slate-500 mt-2">Digital storage and management of church documents</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{documents.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {formatSize(documents.reduce((sum, d) => sum + (d.file_size_bytes || 0), 0))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {new Set(documents.map((d) => d.category).filter(Boolean)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-sm relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search documents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Documents List */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Access Level
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            Loading documents...
                          </td>
                        </tr>
                      ) : filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            No documents. Upload one to get started.
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-blue-600" />
                                {doc.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{doc.category ?? '—'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAccessColor(
                                  doc.access_level
                                )}`}
                              >
                                {doc.access_level === 'Leadership Only' && <Lock className="w-3 h-3 mr-1" />}
                                {doc.access_level}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{formatSize(doc.file_size_bytes)}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Upload New Document</CardTitle>
              <CardDescription>Add documents to the church archive (stored in Supabase Storage)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a file</h3>
                  <p className="text-slate-600 mb-4">{selectedFile ? selectedFile.name : 'No file selected'}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Document Name</label>
                    <Input
                      placeholder="Enter document name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Category</label>
                      <select
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
                      >
                        {categories.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Access Level</label>
                      <select
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={uploadForm.access_level}
                        onChange={(e) => setUploadForm((p) => ({ ...p, access_level: e.target.value }))}
                      >
                        <option value="Public">Public</option>
                        <option value="Staff Only">Staff Only</option>
                        <option value="Leadership Only">Leadership Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="submit"
                      disabled={uploading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
