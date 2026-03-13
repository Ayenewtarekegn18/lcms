'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'am'

interface Translations {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    members: 'Members',
    ministries: 'Ministries',
    financial: 'Financial',
    attendance: 'Attendance',
    events: 'Events',
    spiritual: 'Spiritual Services',
    counseling: 'Counseling',
    youth: 'Youth Programs',
    education: 'Education',
    worship: 'Worship',
    media: 'Media',
    health: 'Health & Wellness',
    community: 'Community Service',
    facilities: 'Facilities',
    reports: 'Reports',

    // Common
    add: 'Add',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    logout: 'Logout',
    search: 'Search',
    filter: 'Filter',
    status: 'Status',

    // Members
    newMember: 'New Member',
    memberList: 'Member List',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    joinDate: 'Join Date',
    memberRole: 'Role',

    // Messages
    loading: 'Loading...',
    noData: 'No data available',
    success: 'Operation successful',
    error: 'An error occurred',
  },
  am: {
    // Navigation
    dashboard: 'ዋናው ቤት',
    members: 'አባላት',
    ministries: 'ሚኒስትሪዎች',
    financial: 'ፋይናንሺያል',
    attendance: 'ውደቂያ',
    events: 'ዝግጅቶች',
    spiritual: 'መንፈሳዊ አገልግሎቶች',
    counseling: 'ምክር ስጦት',
    youth: 'ወጣት ፕሮግራሞች',
    education: 'ትምህርት',
    worship: 'ክርስቶስ ምሳ',
    media: 'መገናኛ',
    health: 'ጤና እና wellness',
    community: 'አገር ጋብ ስራ',
    facilities: 'ሐቀ ቦታ',
    reports: 'ሪፖርቶች',

    // Common
    add: 'ይጨምሩ',
    create: 'ይፍጠሩ',
    edit: 'ያርትዩ',
    delete: 'ሰርዙ',
    save: 'ይቀመጡ',
    cancel: 'ይቋረጡ',
    close: 'ይዝጉ',
    logout: 'ይውጡ',
    search: 'ይፈልጉ',
    filter: 'ይጣሩ',
    status: 'ሁኔታ',

    // Members
    newMember: 'አዲስ አባል',
    memberList: 'ዝርዝር አባላት',
    firstName: 'የመጀመሪያ ስም',
    lastName: 'የመጨረሻ ስም',
    email: 'ኢሜል',
    phone: 'ስልክ',
    joinDate: 'የመቀላቀል ቀን',
    memberRole: 'ሚና',

    // Messages
    loading: 'ይጫናል...',
    noData: 'ምንም መረጃ የለም',
    success: 'ስራ በተሳካ ፈጽሞ',
    error: 'ስህተት ተከስቷል',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'en' || saved === 'am')) {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key
  }

  if (!mounted) return <>{children}</>

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
