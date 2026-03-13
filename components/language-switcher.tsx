'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { useEffect, useState, useContext } from 'react'
import { LanguageContext } from '@/app/providers/language-provider'

export function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [language, setLanguageState] = useState<'en' | 'am'>('en')
  const context = useContext(LanguageContext)

  useEffect(() => {
    const saved = localStorage.getItem('language') as 'en' | 'am'
    if (saved && (saved === 'en' || saved === 'am')) {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentLanguage = context?.language || language

  const handleLanguageChange = (value: string) => {
    const newLang = value as 'en' | 'am'
    setLanguageState(newLang)
    localStorage.setItem('language', newLang)
    if (context?.setLanguage) {
      context.setLanguage(newLang)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} className="text-muted-foreground" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="am">አማርኛ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
