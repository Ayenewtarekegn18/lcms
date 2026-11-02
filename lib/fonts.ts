import { Karla, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from 'next/font/google'

// The typefaces of the church's member registry (lebu-form), so both apps look like one family.
// app/globals.css maps these variables to Tailwind's --font-sans and --font-display.

// Latin body text.
export const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-karla',
  display: 'swap',
})

// Amharic (Ethiopic script): Karla has no Ethiopic glyphs, so the browser falls through to this font
// in the --font-sans stack instead of whatever the device happens to have.
export const noto_ethiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ethiopic',
  display: 'swap',
})

// Headings and the church name: the registry's display face.
export const noto_serif_ethiopic = Noto_Serif_Ethiopic({
  subsets: ['ethiopic', 'latin'],
  weight: ['600', '700'],
  variable: '--font-ethiopic-serif',
  display: 'swap',
})
