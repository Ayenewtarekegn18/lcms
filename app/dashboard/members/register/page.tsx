import { MemberRegistrationForm } from '@/components/members/registration/registration-form'

// Same register as the lebu-form site the church already uses (fields, labels, numbering).
export default function RegisterMemberPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">አዲስ አባል ይመዝገቡ</h1>
        <p className="mt-1 text-slate-600">Register a new member. Fields marked with an asterisk are required; everything else can be filled in later.</p>
      </div>
      <MemberRegistrationForm />
    </div>
  )
}
