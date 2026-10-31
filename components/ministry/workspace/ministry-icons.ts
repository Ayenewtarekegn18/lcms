import {
  Baby, BookOpen, Church, ClipboardList, Flame, Globe, HandCoins, HandHeart, HeartHandshake, MicVocal, Music, Shield,
  Sparkles, Users, type LucideIcon,
} from 'lucide-react'

/** The icon for each ministry workspace, by slug (folder name under app/dashboard/ministry). */
const ICONS: Record<string, LucideIcon> = {
  administration: ClipboardList,
  charity: HandHeart,
  children: Baby,
  choir: Music,
  deacons: Shield,
  'marriage-family': HeartHandshake,
  mission: Globe,
  'prayer-groups': Flame,
  'spiritual-service': Sparkles,
  'stage-worship': MicVocal,
  teaching: BookOpen,
  women: Users,
  'workers-aid': HandCoins,
  youth: Church,
}

export const ministryIcon = (slug: string | null | undefined): LucideIcon => (slug && ICONS[slug]) || Users
