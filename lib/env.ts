import { z } from 'zod'

// Settings the app can't run without. next.config.ts checks them whenever Next starts (dev, build,
// start), so a deployment without them fails at build time with this message, instead of going
// live and answering every request with "Internal Server Error".
const noSurroundingSpace = (v: string) => v === v.trim()
const AGAIN = 'has a space or line break at the start or end; paste it again'

const publicSettings = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: (issue) => (issue.input === undefined ? 'missing' : 'must be text') })
    .refine(noSurroundingSpace, AGAIN)
    .pipe(z.string().url('must be the project URL, for example https://<project-ref>.supabase.co')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: (issue) => (issue.input === undefined ? 'missing' : 'must be text') })
    .refine(noSurroundingSpace, AGAIN)
    .pipe(z.string().min(20, 'must be the anon (public) key from Supabase → Project Settings → API')),
})

export type PublicSettings = z.infer<typeof publicSettings>

export function checkSettings(env: Record<string, string | undefined> = process.env): PublicSettings {
  const result = publicSettings.safeParse(env)
  if (result.success) return result.data
  const problems = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(
    `Missing or invalid settings:\n${problems}\n` +
      'Set them in .env.local (on your computer) or in Vercel → Settings → Environment Variables, then build again. ' +
      'See docs/SETUP.md.',
  )
}
