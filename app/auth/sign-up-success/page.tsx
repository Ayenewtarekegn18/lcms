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

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Lebbu Kale Heywet</h1>
            <p className="text-base text-muted-foreground">Church Management Platform</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-3">
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Account Created!</CardTitle>
              <CardDescription className="text-center">
                Your account has been successfully created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Verify your email</p>
                <p>
                  We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
                </p>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Once verified, you can log in and start using the platform.</p>
              </div>
              <Link href="/auth/login" className="block">
                <Button className="w-full h-10 font-medium">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
