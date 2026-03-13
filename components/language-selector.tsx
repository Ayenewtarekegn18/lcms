'use client'

import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
] as const

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{t('Common.language')}</span>
      <select
        value={i18n.language?.split('-')[0] ?? 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
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
