'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Loading from './loading'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Lebbu Kale Heywet</h1>
            <p className="text-base text-muted-foreground">Church Management Platform</p>
          </div>

          <Suspense fallback={<Loading />}>
            <ErrorCard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ErrorCard() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An error occurred'

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
        <CardDescription className="text-center">
          Something went wrong
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium mb-1">Error Details</p>
          <p>{error}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/auth/login" className="block">
            <Button className="w-full h-10 font-medium" variant="default">
              Try Again
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button className="w-full h-10 font-medium bg-transparent" variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
