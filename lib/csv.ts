// CSV exports (RFC 4180). Client-safe.

export type CsvCell = string | number | null | undefined

/**
 * CSV text for a spreadsheet. Text a spreadsheet would run as a formula (=, +, -, @ at the start)
 * gets a leading apostrophe, so a description such as "=HYPERLINK(…)" stays plain text.
 */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function csvCell(value: CsvCell): string {
  if (value == null) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Browser only: save CSV text as a file. The byte-order mark makes Excel read Amharic text correctly. */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000) // revoking at once can cancel the download in some browsers
}
