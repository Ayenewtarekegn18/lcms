'use client'

import { useTranslation } from 'react-i18next'

/** First focusable element of the dashboard: jumps past the navigation to <main id="main-content">. */
export function SkipLink() {
  const { t } = useTranslation()
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {t('Sidebar.skipToContent')}
    </a>
  )
}
