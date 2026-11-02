'use client'

import { useId } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
] as const

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const id = useId()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs text-muted-foreground">{t('Common.language')}</label>
      <select
        id={id}
        value={i18n.language?.split('-')[0] ?? 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="flex-1 rounded-lg border border-input bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
