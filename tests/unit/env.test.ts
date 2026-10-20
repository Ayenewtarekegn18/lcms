import { describe, expect, it } from 'vitest'
import { checkSettings } from '@/lib/env'

const good = { NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'x'.repeat(40) }

describe('checkSettings', () => {
  it('accepts a project URL and an anon key', () => {
    expect(checkSettings(good)).toEqual(good)
  })

  it('names every missing setting and says where to set it', () => {
    expect(() => checkSettings({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL: missing[\s\S]*NEXT_PUBLIC_SUPABASE_ANON_KEY: missing[\s\S]*Vercel/)
  })

  it('rejects a value pasted with a line break or spaces', () => {
    expect(() => checkSettings({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: `${good.NEXT_PUBLIC_SUPABASE_ANON_KEY}\n` })).toThrow(/ANON_KEY: has a space or line break/)
    expect(() => checkSettings({ ...good, NEXT_PUBLIC_SUPABASE_URL: ` ${good.NEXT_PUBLIC_SUPABASE_URL}` })).toThrow(/URL: has a space or line break/)
  })

  it('rejects something that is not a URL or not a key', () => {
    expect(() => checkSettings({ ...good, NEXT_PUBLIC_SUPABASE_URL: 'abcdefghijklmnopqrst' })).toThrow(/must be the project URL/)
    expect(() => checkSettings({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'short' })).toThrow(/must be the anon/)
  })
})
