import localFont from 'next/font/local'

// Fonts ship with the app (the @fontsource packages), so building never depends on reaching Google
// Fonts: a failed download there used to fail the whole build. app/globals.css maps these variables
// to Tailwind's --font-sans.

// Latin text: Plus Jakarta Sans, a modern geometric sans (variable weight).
export const jakarta = localFont({
  src: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
})

// Amharic (Ethiopic script): Jakarta has no Ethiopic glyphs, so the browser falls through to this
// font in the --font-sans stack instead of whatever the device happens to have.
export const noto_ethiopic = localFont({
  src: '../node_modules/@fontsource-variable/noto-sans-ethiopic/files/noto-sans-ethiopic-ethiopic-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-ethiopic',
  display: 'swap',
})
