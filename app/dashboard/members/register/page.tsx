'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ChildFormData {
  first_name: string
  father_name: string
  date_of_birth: string
  gender: string
}

export default function MemberRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [showNewChildForm, setShowNewChildForm] = useState(false)
  const [newChildData, setNewChildData] = useState<ChildFormData>({
    first_name: '',
    father_name: '',
    date_of_birth: '',
    gender: 'male',
  })
  const supabase = createClient()

  const [formData, setFormData] = useState({
    // Step 1: Personal Profile
    title: '',
    first_name: '',
    father_name: '',
    grandfather_name: '',
    gender: 'male',
    nationality: 'ethiopian',
    mothers_first_name: '',
    mothers_father_name: '',
    mothers_grandmother_name: '',
    birth_country: 'ethiopia',
    birth_region: '',
    birth_zone: '',
    birth_city: '',
    date_of_birth: '',
    id_type: '',
    id_number: '',
    language: '',
    family_father_id: '',
    family_mother_id: '',

    // Step 2: Academic Status
    academic_status: '',
    field_of_study: '',
    full_time_job: '',
    profession: '',
    company: '',
    monthly_income: '',
    part_time_job: '',

    // Step 3: Marital Status
    marital_status: 'single',
    has_children: 'no',
    children_ids: [] as string[],
    spouse_name: '',

    // Step 4: Previous Church Info
    transferred_from_church: 'no',
    former_church_name: '',
    date_of_resignation: '',
    reference_title: '',
    reference_name: '',
    reference_phone: '',
    resignation_reason: '',
    resignation_other: '',
    former_belief: '',
    former_belief_other: '',

    // Step 5: Current Church Engagement
    salvation_story: '',
    salvation_date: '',
    is_baptized: 'no',
    membership_date: '',
    cell_group_participation: 'no',
    ministry_department: '',
    ministry_start_date: '',
    ministry_role: '',
    gifts_talents: [] as string[],
    ministry_preferences: [] as string[],
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('Error fetching members:', error)
        toast.error('Failed to load members list')
        return
      }
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members list')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.first_name || !formData.father_name || !formData.grandfather_name || !formData.date_of_birth) {
          toast.error('Please fill in all required fields (First Name, Father Name, Grandfather Name, Date of Birth)')
          return false
        }
        return true
      case 2:
        if (!formData.academic_status || !formData.full_time_job) {
          toast.error('Please fill in all required fields (Academic Status, Full Time Job Status)')
          return false
        }
        return true
      case 3:
        if (!formData.marital_status || !formData.has_children) {
          toast.error('Please fill in all required fields (Marital Status, Has Children)')
          return false
        }
        return true
      case 4:
        if (formData.transferred_from_church === 'yes' && !formData.resignation_reason) {
          toast.error('Please select a reason for resignation')
          return false
        }
        if (formData.transferred_from_church === 'no' && !formData.former_belief) {
          toast.error('Please select your former belief')
          return false
        }
        return true
      case 5:
        if (!formData.is_baptized || !formData.membership_date) {
          toast.error('Please fill in all required fields (Baptized, Membership Date)')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return

    try {
      const lastName = [formData.father_name, formData.grandfather_name].filter(Boolean).join(' ') || formData.father_name || 'N/A'
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          first_name: formData.first_name?.trim(),
          last_name: lastName,
          email: null,
          phone: formData.reference_phone?.trim() || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address: formData.birth_city ? `${formData.birth_region || ''} ${formData.birth_zone || ''} ${formData.birth_city}`.trim() || null : null,
          city: formData.birth_city || null,
          country: formData.birth_country || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      toast.success('Member registered successfully!')
      setFormData({
        title: '',
        first_name: '',
        father_name: '',
        grandfather_name: '',
        gender: 'male',
        nationality: 'ethiopian',
        mothers_first_name: '',
        mothers_father_name: '',
        mothers_grandmother_name: '',
        birth_country: 'ethiopia',
        birth_region: '',
        birth_zone: '',
        birth_city: '',
        date_of_birth: '',
        id_type: '',
        id_number: '',
        language: '',
        family_father_id: '',
        family_mother_id: '',
        academic_status: '',
        field_of_study: '',
        full_time_job: '',
        profession: '',
        company: '',
        monthly_income: '',
        part_time_job: '',
        marital_status: 'single',
        has_children: 'no',
        children_ids: [],
        spouse_name: '',
        transferred_from_church: 'no',
        former_church_name: '',
        date_of_resignation: '',
        reference_title: '',
        reference_name: '',
        reference_phone: '',
        resignation_reason: '',
        resignation_other: '',
        former_belief: '',
        former_belief_other: '',
        salvation_story: '',
        salvation_date: '',
        is_baptized: 'no',
        membership_date: '',
        cell_group_participation: 'no',
        ministry_department: '',
        ministry_start_date: '',
        ministry_role: '',
        gifts_talents: [],
        ministry_preferences: [],
      })
      setCurrentStep(1)
      window.location.href = '/dashboard/members'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register member. Please try again.')
      console.error('Error submitting form:', error)
    }
  }

  const stepNames = [
    'Personal Profile',
    'Academic Status',
    'Marital Status',
    'Previous Church',
    'Church Engagement',
  ]

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between gap-4 mb-8 w-full">
      {stepNames.map((name, idx) => (
        <div key={idx} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${
                idx + 1 <= currentStep
                  ? 'bg-[#3E50B5] text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {idx + 1}
            </div>
            <span className={`text-xs mt-2 ${idx + 1 <= currentStep ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              {name}
            </span>
          </div>
          {idx < stepNames.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 transition-all ${
                idx + 1 < currentStep ? 'bg-[#3E50B5]' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const handleAddNewChild = () => {
    if (!newChildData.first_name || !newChildData.father_name || !newChildData.date_of_birth) {
      toast.error('Please fill in all required fields for the child')
      return
    }
    // TODO: Add child to database and then add to selectedChildren
    toast.success('Child added successfully')
    setShowNewChildForm(false)
    setNewChildData({ first_name: '', father_name: '', date_of_birth: '', gender: 'male' })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Member Registration</h1>
        <p className="text-slate-600 mb-8">Step {currentStep} of 5: {stepNames[currentStep - 1]}</p>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-4">
            {renderStepIndicator()}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STEP 1: Personal Profile */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-3 flex flex-col items-center">
                    <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 text-center text-sm">Profile Photo</span>
                      )}
                    </div>
                    <label>
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <Label className="mb-2 block">Title</Label>
                    <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="miss">Miss</SelectItem>
                        <SelectItem value="dr">Dr.</SelectItem>
                        <SelectItem value="prof">Prof.</SelectItem>
                        <SelectItem value="rev">Rev.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">First Name *</Label>
                    <Input
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Father Name *</Label>
                    <Input
                      placeholder="Father's name"
                      value={formData.father_name}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Grandfather Name *</Label>
                    <Input
                      placeholder="Grandfather's name"
                      value={formData.grandfather_name}
                      onChange={(e) => handleInputChange('grandfather_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Gender *</Label>
                    <div className="flex gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={() => handleInputChange('gender', 'male')}
                          className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                          style={{
                            backgroundColor: formData.gender === 'male' ? '#000000' : '#ffffff',
                            borderColor: formData.gender === 'male' ? '#000000' : '#cbd5e1',
                          }}
                        />
                        <span className="text-slate-900">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={() => handleInputChange('gender', 'female')}
                          className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                          style={{
                            backgroundColor: formData.gender === 'female' ? '#000000' : '#ffffff',
                            borderColor: formData.gender === 'female' ? '#000000' : '#cbd5e1',
                          }}
                        />
                        <span className="text-slate-900">Female</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Nationality *</Label>
                    <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethiopian">Ethiopian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="mb-2 block">Family</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-600 mb-2 block">Father</Label>
                        <Select 
                          value={formData.family_father_id || undefined} 
                          onValueChange={(value) => handleInputChange('family_father_id', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Search father's name" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name || ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600 mb-2 block">Mother</Label>
                        <Select 
                          value={formData.family_mother_id || undefined} 
                          onValueChange={(value) => handleInputChange('family_mother_id', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Search mother's name" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name || ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Mother's First Name</Label>
                    <Input
                      placeholder="Mother's first name"
                      value={formData.mothers_first_name}
                      onChange={(e) => handleInputChange('mothers_first_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Mother's Father Name</Label>
                    <Input
                      placeholder="Maternal grandfather name"
                      value={formData.mothers_father_name}
                      onChange={(e) => handleInputChange('mothers_father_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Mother's Grandmother Name</Label>
                    <Input
                      placeholder="Maternal grandmother name"
                      value={formData.mothers_grandmother_name}
                      onChange={(e) => handleInputChange('mothers_grandmother_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Birth Country</Label>
                    <Select value={formData.birth_country} onValueChange={(value) => handleInputChange('birth_country', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethiopia">Ethiopia</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Birth Region</Label>
                    <Input
                      placeholder="Region"
                      value={formData.birth_region}
                      onChange={(e) => handleInputChange('birth_region', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Birth Zone</Label>
                    <Input
                      placeholder="Zone"
                      value={formData.birth_zone}
                      onChange={(e) => handleInputChange('birth_zone', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="mb-2 block">Birth City</Label>
                    <Input
                      placeholder="City"
                      value={formData.birth_city}
                      onChange={(e) => handleInputChange('birth_city', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">ID Type</Label>
                    <Select value={formData.id_type} onValueChange={(value) => handleInputChange('id_type', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="driver_license">Driver License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="mb-2 block">ID Number</Label>
                    <Input
                      placeholder="ID number"
                      value={formData.id_number}
                      onChange={(e) => handleInputChange('id_number', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label className="mb-2 block">Upload ID Document</Label>
                    <div className="w-full px-3 py-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                      {idPreview ? (
                        <img src={idPreview || "/placeholder.svg"} alt="ID Preview" className="max-h-32 mx-auto mb-3" />
                      ) : (
                        <span className="text-slate-400">ID Document Preview</span>
                      )}
                      <label>
                        <Button variant="outline" className="mt-2 bg-transparent">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload ID
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <Label className="mb-2 block">Language</Label>
                    <Input
                      placeholder="Language spoken"
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Academic Status */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Academic Status *</Label>
                  <Select value={formData.academic_status} onValueChange={(value) => handleInputChange('academic_status', value)}>
                    <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary School</SelectItem>
                      <SelectItem value="secondary">Secondary School</SelectItem>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Field of Study</Label>
                  <Input
                    placeholder="Your field of study"
                    value={formData.field_of_study}
                    onChange={(e) => handleInputChange('field_of_study', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Full Time Job Status *</Label>
                  <Select value={formData.full_time_job} onValueChange={(value) => handleInputChange('full_time_job', value)}>
                    <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="non_government">Non Government</SelectItem>
                      <SelectItem value="private_company">Private Company</SelectItem>
                      <SelectItem value="private_business">Private Business</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="housewife">Housewife</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Profession</Label>
                  <Input
                    placeholder="Your profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Company</Label>
                  <Input
                    placeholder="Company name"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Monthly Income Range</Label>
                  <Select value={formData.monthly_income} onValueChange={(value) => handleInputChange('monthly_income', value)}>
                    <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0_500">0 - 500</SelectItem>
                      <SelectItem value="500_1000">500 - 1000</SelectItem>
                      <SelectItem value="1000_5000">1000 - 5000</SelectItem>
                      <SelectItem value="5000_plus">5000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Part Time Job</Label>
                  <Input
                    placeholder="Part time job details"
                    value={formData.part_time_job}
                    onChange={(e) => handleInputChange('part_time_job', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Marital Status */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Marital Status *</Label>
                  <div className="flex gap-6 mt-3">
                    {['single', 'married', 'divorced', 'separated', 'widowed'].map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="marital_status"
                          value={status}
                          checked={formData.marital_status === status}
                          onChange={() => handleInputChange('marital_status', status)}
                          className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                          style={{
                            backgroundColor: formData.marital_status === status ? '#000000' : '#ffffff',
                            borderColor: formData.marital_status === status ? '#000000' : '#cbd5e1',
                          }}
                        />
                        <span className="text-slate-900">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.marital_status === 'married' && (
                  <div>
                    <Label className="mb-2 block">Spouse Name</Label>
                    <Input
                      placeholder="Spouse's full name"
                      value={formData.spouse_name}
                      onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Have Children or Dependents? *</Label>
                  <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="has_children"
                        value="yes"
                        checked={formData.has_children === 'yes'}
                        onChange={() => handleInputChange('has_children', 'yes')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.has_children === 'yes' ? '#000000' : '#ffffff',
                          borderColor: formData.has_children === 'yes' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="has_children"
                        value="no"
                        checked={formData.has_children === 'no'}
                        onChange={() => handleInputChange('has_children', 'no')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.has_children === 'no' ? '#000000' : '#ffffff',
                          borderColor: formData.has_children === 'no' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">No</span>
                    </label>
                  </div>
                </div>

                {formData.has_children === 'yes' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Select Children</Label>
                      <Select
                        value={undefined}
                        onValueChange={(value) => {
                          if (value === 'new') {
                            setShowNewChildForm(true)
                          } else if (value && !selectedChildren.includes(value)) {
                            setSelectedChildren([...selectedChildren, value])
                            handleInputChange('children_ids', [...formData.children_ids, value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                          <SelectValue placeholder="Select existing member or add new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">+ New</SelectItem>
                          {members
                            .filter((m) => !selectedChildren.includes(m.id))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name || ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showNewChildForm && (
                      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
                        <h4 className="font-semibold text-slate-900">Add New Child</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-2 block">First Name *</Label>
                            <Input
                              value={newChildData.first_name}
                              onChange={(e) => setNewChildData({ ...newChildData, first_name: e.target.value })}
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Father Name *</Label>
                            <Input
                              value={newChildData.father_name}
                              onChange={(e) => setNewChildData({ ...newChildData, father_name: e.target.value })}
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Date of Birth *</Label>
                            <Input
                              type="date"
                              value={newChildData.date_of_birth}
                              onChange={(e) => setNewChildData({ ...newChildData, date_of_birth: e.target.value })}
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Gender</Label>
                            <Select value={newChildData.gender} onValueChange={(value) => setNewChildData({ ...newChildData, gender: value })}>
                              <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddNewChild} className="bg-[#3E50B5] hover:bg-[#3E50B5]/90 text-white">
                            Add Child
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewChildForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedChildren.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Children:</Label>
                        {selectedChildren.map((childId) => {
                          const child = members.find((m) => m.id === childId)
                          return (
                            <div key={childId} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-900">
                                {child ? `${child.first_name} ${child.last_name || ''}` : 'Unknown'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedChildren(selectedChildren.filter((id) => id !== childId))
                                  handleInputChange('children_ids', formData.children_ids.filter((id) => id !== childId))
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Previous Church Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Are you transferred from another church?</Label>
                  <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transferred"
                        value="yes"
                        checked={formData.transferred_from_church === 'yes'}
                        onChange={() => handleInputChange('transferred_from_church', 'yes')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.transferred_from_church === 'yes' ? '#000000' : '#ffffff',
                          borderColor: formData.transferred_from_church === 'yes' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transferred"
                        value="no"
                        checked={formData.transferred_from_church === 'no'}
                        onChange={() => handleInputChange('transferred_from_church', 'no')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.transferred_from_church === 'no' ? '#000000' : '#ffffff',
                          borderColor: formData.transferred_from_church === 'no' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">No</span>
                    </label>
                  </div>
                </div>

                {formData.transferred_from_church === 'yes' && (
                  <>
                    <div>
                      <Label className="mb-2 block">Former Church Name</Label>
                      <Input
                        placeholder="Name of previous church"
                        value={formData.former_church_name}
                        onChange={(e) => handleInputChange('former_church_name', e.target.value)}
                        className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block">Date of Resignation</Label>
                      <Input
                        type="date"
                        value={formData.date_of_resignation}
                        onChange={(e) => handleInputChange('date_of_resignation', e.target.value)}
                        className="bg-white border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Previous Church Spiritual Reference</h3>

                      <div>
                        <Label className="mb-2 block">Reference Title</Label>
                        <Select value={formData.reference_title} onValueChange={(value) => handleInputChange('reference_title', value)}>
                          <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Select Title" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pastor">Pastor</SelectItem>
                            <SelectItem value="evangelist">Evangelist</SelectItem>
                            <SelectItem value="elder">Elder</SelectItem>
                            <SelectItem value="deacon">Deacon</SelectItem>
                            <SelectItem value="leader">Leader</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-2 block">Full Name</Label>
                        <Input
                          placeholder="Reference person's name"
                          value={formData.reference_name}
                          onChange={(e) => handleInputChange('reference_name', e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Phone Number</Label>
                        <Input
                          placeholder="+251 ..."
                          value={formData.reference_phone}
                          onChange={(e) => handleInputChange('reference_phone', e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <Label className="mb-2 block">Reason for Resignation *</Label>
                      <div className="space-y-2 mt-3">
                        {[
                          'Due to change on residential address',
                          'Due to job location transfer',
                          'Due to personal affairs',
                          'Due to conflict',
                          'Due to marriage',
                          'Due to academic reason',
                          'Other',
                        ].map((reason) => (
                          <label key={reason} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="resignation_reason"
                              value={reason}
                              checked={formData.resignation_reason === reason}
                              onChange={() => handleInputChange('resignation_reason', reason)}
                              className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                              style={{
                                backgroundColor: formData.resignation_reason === reason ? '#000000' : '#ffffff',
                                borderColor: formData.resignation_reason === reason ? '#000000' : '#cbd5e1',
                              }}
                            />
                            <span className="text-slate-900">{reason}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.resignation_reason === 'Other' && (
                      <div>
                        <Label className="mb-2 block">Please specify</Label>
                        <Input
                          placeholder="Specify the reason"
                          value={formData.resignation_other}
                          onChange={(e) => handleInputChange('resignation_other', e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    )}
                  </>
                )}

                {formData.transferred_from_church === 'no' && (
                  <div>
                    <Label className="mb-2 block">What was your former belief?</Label>
                    <Select value={formData.former_belief} onValueChange={(value) => handleInputChange('former_belief', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select belief" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atheist">Atheist</SelectItem>
                        <SelectItem value="agnostic">Agnostic</SelectItem>
                        <SelectItem value="traditional">Traditional Religion</SelectItem>
                        <SelectItem value="muslim">Muslim</SelectItem>
                        <SelectItem value="other_christian">Other Christian Denomination</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.former_belief === 'other' && (
                      <div className="mt-4">
                        <Label className="mb-2 block">Please describe your former belief</Label>
                        <textarea
                          placeholder="Describe your former belief..."
                          value={formData.former_belief_other}
                          onChange={(e) => handleInputChange('former_belief_other', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Current Church Engagement */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">How did you accept Jesus Christ?</Label>
                  <textarea
                    placeholder="Tell your salvation story"
                    value={formData.salvation_story}
                    onChange={(e) => handleInputChange('salvation_story', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Salvation Date</Label>
                  <Input
                    type="date"
                    value={formData.salvation_date}
                    onChange={(e) => handleInputChange('salvation_date', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Are you baptized? *</Label>
                  <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="baptized"
                        value="yes"
                        checked={formData.is_baptized === 'yes'}
                        onChange={() => handleInputChange('is_baptized', 'yes')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.is_baptized === 'yes' ? '#000000' : '#ffffff',
                          borderColor: formData.is_baptized === 'yes' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="baptized"
                        value="no"
                        checked={formData.is_baptized === 'no'}
                        onChange={() => handleInputChange('is_baptized', 'no')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.is_baptized === 'no' ? '#000000' : '#ffffff',
                          borderColor: formData.is_baptized === 'no' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Membership Date *</Label>
                  <Input
                    type="date"
                    value={formData.membership_date}
                    onChange={(e) => handleInputChange('membership_date', e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Do you participate in cell group at church?</Label>
                  <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cell_group"
                        value="yes"
                        checked={formData.cell_group_participation === 'yes'}
                        onChange={() => handleInputChange('cell_group_participation', 'yes')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.cell_group_participation === 'yes' ? '#000000' : '#ffffff',
                          borderColor: formData.cell_group_participation === 'yes' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cell_group"
                        value="no"
                        checked={formData.cell_group_participation === 'no'}
                        onChange={() => handleInputChange('cell_group_participation', 'no')}
                        className="w-4 h-4 border-2 border-slate-300 appearance-none rounded-full checked:bg-black checked:border-black"
                        style={{
                          backgroundColor: formData.cell_group_participation === 'no' ? '#000000' : '#ffffff',
                          borderColor: formData.cell_group_participation === 'no' ? '#000000' : '#cbd5e1',
                        }}
                      />
                      <span className="text-slate-900">No</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Ministry Engagement</h3>

                  <div>
                    <Label className="mb-2 block">Your Current Ministry/Department</Label>
                    <Select value={formData.ministry_department} onValueChange={(value) => handleInputChange('ministry_department', value)}>
                      <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select Ministry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spiritual_service">Spiritual Service</SelectItem>
                        <SelectItem value="teaching">Teaching & Seminar</SelectItem>
                        <SelectItem value="women">Women's Ministry</SelectItem>
                        <SelectItem value="youth">Youth Ministry</SelectItem>
                        <SelectItem value="children">Children Ministry</SelectItem>
                        <SelectItem value="mission">Mission Ministry</SelectItem>
                        <SelectItem value="stage_worship">Stage & Worship</SelectItem>
                        <SelectItem value="choir">Choir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Engagement Start Date</Label>
                    <Input
                      type="date"
                      value={formData.ministry_start_date}
                      onChange={(e) => handleInputChange('ministry_start_date', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Your Role in the Ministry</Label>
                    <Input
                      placeholder="e.g., Leader, Assistant, Member"
                      value={formData.ministry_role}
                      onChange={(e) => handleInputChange('ministry_role', e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Gifts and Talents</Label>
                    <textarea
                      placeholder="List your gifts and talents"
                      value={formData.gifts_talents.join(', ')}
                      onChange={(e) => handleInputChange('gifts_talents', e.target.value.split(',').map(g => g.trim()))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Ministry Preferences</Label>
                    <div className="space-y-2 mt-3">
                      {['Spiritual', 'Technical', 'Art & Music', 'Media', 'Digital', 'Leadership'].map(
                        (pref) => (
                          <label key={pref} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.ministry_preferences.includes(pref)}
                              onChange={(e) => {
                                const prefs = formData.ministry_preferences
                                if (e.target.checked) {
                                  handleInputChange('ministry_preferences', [...prefs, pref])
                                } else {
                                  handleInputChange(
                                    'ministry_preferences',
                                    prefs.filter((p) => p !== pref)
                                  )
                                }
                              }}
                              className="w-4 h-4 border-2 border-slate-300 rounded checked:bg-black checked:border-black"
                            />
                            <span className="text-slate-900">{pref}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrev}
            disabled={currentStep === 1}
            variant="outline"
            className="border-slate-300 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === 5 ? (
            <Button
              onClick={handleSubmit}
              className="bg-[#3E50B5] hover:bg-[#3E50B5]/90 text-white"
            >
              Submit Registration
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#3E50B5] hover:bg-[#3E50B5]/90 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
