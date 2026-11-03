'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileJson, ImageIcon, LoaderCircle, Upload, XCircle } from 'lucide-react'
import { StatCard } from '@/components/app'
import { Button } from '@/components/ui/button'
import { readApiError } from '@/lib/api/client-errors'
import { IMPORT_BATCH, membersFromJson, prepareImport, type ImportResult, type PreparedMember } from '@/lib/members/registration'

// Members → Import: lebu-form JSON files (a backup, or one file per member) into the register, with
// their existing numbers, and optionally their photos (files named by member number, e.g. LKHC-0019.jpg).

type Loaded = { record: Record<string, unknown>; prepared: PreparedMember }
type Stage = 'choose' | 'importing' | 'done'

const PHOTO_MAX_PX = 1200
const prefixOf = (number: string) => number.split('-')[0]
const photoKey = (fileName: string) => fileName.replace(/\.[^.]+$/, '').trim().toUpperCase()

/** A photo as a JPEG no larger than PHOTO_MAX_PX on its long side (the upload limit is 2 MB). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('photo'))), 'image/jpeg', 0.88))
}

export function MemberImport() {
  const [loaded, setLoaded] = useState<Loaded[]>([])
  const [fileProblems, setFileProblems] = useState<string[]>([])
  const [photos, setPhotos] = useState<Map<string, File>>(new Map())
  const [current, setCurrent] = useState<{ prefix: string; next: string } | null>(null)
  const [usePrefix, setUsePrefix] = useState(true)
  const [stage, setStage] = useState<Stage>('choose')
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' })
  const [results, setResults] = useState<ImportResult[]>([])
  const [photoReport, setPhotoReport] = useState({ uploaded: 0, failed: [] as string[] })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/members/import').then((r) => (r.ok ? r.json() : null)).then(setCurrent, () => setCurrent(null))
  }, [])

  const ready = loaded.filter((l) => l.prepared.ok)
  const problems = loaded.filter((l) => !l.prepared.ok)
  const duplicates = useMemo(() => {
    const seen = new Map<string, number>()
    for (const l of ready) seen.set(l.prepared.number, (seen.get(l.prepared.number) ?? 0) + 1)
    return [...seen].filter(([, n]) => n > 1).map(([k]) => k)
  }, [ready])
  const prefixes = [...new Set(ready.map((l) => prefixOf(l.prepared.number)))]
  const newPrefix = prefixes.length === 1 && current && prefixes[0] !== current.prefix.toUpperCase() ? prefixes[0] : null
  const photoMatches = ready.filter((l) => photos.has(l.prepared.number)).length

  async function chooseFiles(files: FileList | null) {
    if (!files?.length) return
    const next: Loaded[] = []
    const bad: string[] = []
    for (const file of Array.from(files)) {
      try {
        for (const record of membersFromJson(JSON.parse(await file.text()))) next.push({ record, prepared: prepareImport(record) })
      } catch {
        bad.push(`${file.name}: not a JSON file lebu-form wrote`)
      }
    }
    setLoaded(next)
    setFileProblems(bad)
  }

  function choosePhotos(files: FileList | null) {
    setPhotos(new Map(Array.from(files ?? []).filter((f) => f.type.startsWith('image/')).map((f) => [photoKey(f.name), f])))
  }

  async function run() {
    setStage('importing')
    setError(null)
    const all: ImportResult[] = []
    const batches = Math.ceil(ready.length / IMPORT_BATCH)
    for (let i = 0; i < batches; i++) {
      setProgress({ done: i * IMPORT_BATCH, total: ready.length, label: 'Importing members' })
      const res = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: ready.slice(i * IMPORT_BATCH, (i + 1) * IMPORT_BATCH).map((l) => l.record),
          ...(newPrefix && usePrefix && i === batches - 1 ? { prefix: newPrefix } : {}),
        }),
      }).catch(() => null)
      if (!res?.ok) {
        setError(res ? (await readApiError(res, 'The import stopped.')).message : 'The import stopped: check your connection.')
        break
      }
      all.push(...((await res.json()) as { results: ImportResult[] }).results)
      setResults([...all])
    }

    // Photos for the members now in the register (imported now, or earlier without a photo).
    const withPhoto = all.filter((r) => r.id && r.status !== 'failed' && photos.has(r.number))
    let uploaded = 0
    const failed: string[] = []
    for (const [i, r] of withPhoto.entries()) {
      setProgress({ done: i, total: withPhoto.length, label: 'Uploading photos' })
      try {
        const form = new FormData()
        form.append('photo', await shrink(photos.get(r.number)!), `${r.number}.jpg`)
        const res = await fetch(`/api/members/${r.id}/photo`, { method: 'POST', body: form })
        if (res.ok) uploaded++
        else failed.push(r.number)
      } catch {
        failed.push(r.number)
      }
    }
    setPhotoReport({ uploaded, failed })
    setStage('done')
  }

  if (stage !== 'choose') {
    const count = (s: ImportResult['status']) => results.filter((r) => r.status === s).length
    const failedRows = results.filter((r) => r.status === 'failed')
    const droppedRows = results.filter((r) => r.dropped?.length)
    return (
      <div className="space-y-6">
        {stage === 'importing' && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft" role="status">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden /> {progress.label}: {progress.done} of {progress.total}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}
        {error && <Notice tone="bad">{error} Members imported before it stopped are in the register; run the import again to continue (they will be skipped).</Notice>}
        <section aria-label="Import results" className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Imported" value={count('imported')} icon={CheckCircle2} />
          <StatCard label="Already in the register" value={count('exists')} icon={FileJson} hint="Left as they were" />
          <StatCard label="Not imported" value={count('failed')} icon={XCircle} />
        </section>
        {stage === 'done' && photos.size > 0 && (
          <Notice tone={photoReport.failed.length ? 'warn' : 'ok'}>
            Photos uploaded: {photoReport.uploaded}.{photoReport.failed.length ? ` Not uploaded: ${photoReport.failed.join(', ')}.` : ''}
          </Notice>
        )}
        {failedRows.length > 0 && <List title="Not imported" rows={failedRows.map((r) => `${r.label}: ${r.error}`)} />}
        {droppedRows.length > 0 && <List title="Imported without some optional answers (not valid form values)" rows={droppedRows.map((r) => `${r.label}: ${r.dropped!.join(', ')}`)} />}
        {stage === 'done' && (
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/dashboard/members">Open the member list</Link></Button>
            <Button variant="outline" onClick={() => { setStage('choose'); setLoaded([]); setResults([]); setPhotos(new Map()) }}>Import more</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Picker
          icon={FileJson}
          title="1. Member files"
          help="The JSON lebu-form saves: a backup of the whole register, or one file per member. Choose one or many."
          accept="application/json,.json"
          onChange={chooseFiles}
          chosen={loaded.length ? `${loaded.length} member${loaded.length === 1 ? '' : 's'} found` : null}
        />
        <Picker
          icon={ImageIcon}
          title="2. Photos (optional)"
          help="Pictures named by member number, such as LKHC-0019.jpg. They are matched to the members you import."
          accept="image/*"
          onChange={choosePhotos}
          chosen={photos.size ? `${photos.size} photo${photos.size === 1 ? '' : 's'}, ${photoMatches} matching a member` : null}
        />
      </div>

      {fileProblems.length > 0 && <List title="Files that could not be read" rows={fileProblems} />}

      {loaded.length > 0 && (
        <>
          <section aria-label="Check" className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Ready to import" value={ready.length} icon={CheckCircle2} />
            <StatCard label="With problems" value={problems.length} icon={AlertTriangle} hint="Skipped" />
            <StatCard label="With a photo" value={photoMatches} icon={ImageIcon} />
          </section>

          {duplicates.length > 0 && <Notice tone="warn">These numbers appear more than once; only the first is imported: {duplicates.join(', ')}.</Notice>}
          {problems.length > 0 && <List title="Will be skipped" rows={problems.map((l) => `${l.prepared.label}: ${(l.prepared as { error: string }).error}`)} />}

          {newPrefix && current && (
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={usePrefix} onChange={(e) => setUsePrefix(e.target.checked)} />
              <span>
                <span className="font-semibold text-foreground">Number new registrations {newPrefix}-… too</span>
                <span className="block text-muted-foreground">
                  The imported members are numbered {newPrefix}-…, but members registered in this app would be {current.prefix}-… (next: {current.next}).
                </span>
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={run} disabled={!ready.length} className="h-11 px-5">
              <Upload aria-hidden /> Import {ready.length} member{ready.length === 1 ? '' : 's'}
            </Button>
            <p className="text-sm text-muted-foreground">Members already in the register (same number) are left as they are, so importing twice is safe.</p>
          </div>
        </>
      )}
    </div>
  )
}

function Picker({ icon: Icon, title, help, accept, onChange, chosen }: { icon: typeof FileJson; title: string; help: string; accept: string; onChange: (f: FileList | null) => void; chosen: string | null }) {
  return (
    <label className="group flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-dashed border-input bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring">
      <span className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-5" aria-hidden /></span>
        <span className="font-semibold text-foreground">{title}</span>
      </span>
      <span className="text-sm text-muted-foreground">{help}</span>
      <span className={chosen ? 'text-sm font-medium text-primary' : 'text-sm font-medium text-foreground underline-offset-4 group-hover:underline'}>{chosen ?? 'Choose files…'}</span>
      <input type="file" multiple accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files)} />
    </label>
  )
}

function Notice({ tone, children }: { tone: 'ok' | 'warn' | 'bad'; children: React.ReactNode }) {
  const style = { ok: 'border-[#12B76A]/25 bg-[#12B76A]/8 text-[#067647]', warn: 'border-[#F79009]/30 bg-[#F79009]/10 text-[#93370D]', bad: 'border-destructive/25 bg-destructive/8 text-destructive' }[tone]
  return <div role={tone === 'bad' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${style}`}>{children}</div>
}

function List({ title, rows }: { title: string; rows: string[] }) {
  return (
    <details className="rounded-2xl border border-border bg-card p-4 shadow-soft" open={rows.length <= 10}>
      <summary className="cursor-pointer text-sm font-semibold text-foreground">{title} ({rows.length})</summary>
      <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm text-muted-foreground">
        {rows.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </details>
  )
}
