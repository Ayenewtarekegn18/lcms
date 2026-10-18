'use client'

import React, { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Check environment variables on mount (non-blocking)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Configuration error: Supabase credentials not found. Please restart your dev server.')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Verify env vars before creating client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Please restart your dev server.')
      }
      
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.')
        } else {
          setError(error.message || 'Login failed. Please try again.')
        }
        return
      }
      
      if (data?.user) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Login successful but no user data received. Please try again.')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Check if it's a network/fetch error
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch') || err.name === 'TypeError') {
          setError(
            'Cannot connect to Supabase. Please:\n' +
            '1. Check your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
            '2. Restart your dev server (npm run dev)\n' +
            '3. Verify your Supabase project is active in the dashboard'
          )
        } else if (err.message.includes('Missing Supabase')) {
          setError(err.message)
        } else {
          setError(err.message || 'An unexpected error occurred. Please try again.')
        }
      } else {
        setError('An error occurred during login. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">{t('Auth.title')}</h1>
            <p className="text-slate-600 text-lg">{t('Auth.subtitle')}</p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-black mb-2">{t('Auth.welcomeBack')}</h2>
              <p className="text-slate-600">{t('Auth.signInPrompt')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-medium">{t('Auth.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('Auth.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="form-input bg-white border-slate-300 text-black placeholder-slate-400 focus:border-[#3E50B5] h-12 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">{t('Auth.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('Auth.passwordPlaceholder')}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="form-input bg-white border-slate-300 text-black placeholder-slate-400 focus:border-[#3E50B5] h-12 rounded-lg"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="login-button w-full h-12 text-white font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Auth.signingIn')}
                  </span>
                ) : (
                  t('Auth.signIn')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-slate-600 text-sm">{t('Auth.noAccount')}</span>{' '}
              <Link
                href="/auth/sign-up"
                className="text-black font-semibold hover:text-slate-700 transition-colors"
              >
                {t('Auth.createOne')}
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">{t('Auth.footer')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
