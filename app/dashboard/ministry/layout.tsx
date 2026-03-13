import React from "react"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ministry',
  description: 'Ministry Management',
}

export default function MinistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
