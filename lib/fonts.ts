import { Noto_Sans_Ethiopic, Varela_Round } from 'next/font/google'

// Latin text. The variable keeps its historical name (--font-fredoka); app/globals.css maps it to
// Tailwind's --font-sans, so it can't simply be renamed to --font-sans (that would refer to itself).
export const varela_round = Varela_Round({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-fredoka',
  display: 'swap',
})

// Amharic (Ethiopic script): Varela Round has no Ethiopic glyphs, so the browser falls through to
// this font in the --font-sans stack (app/globals.css) instead of whatever the device happens to have.
export const noto_ethiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ethiopic',
  display: 'swap',
})
