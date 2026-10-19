'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const W = 480
const H = 600 // 4:5 portrait, the shape the ID card uses

/** Centre-crop to 4:5 (biased upward to keep the head) and encode as JPEG, like lebu-form. */
function toPortrait(source: CanvasImageSource, sw: number, sh: number): Promise<Blob> {
  const target = W / H
  let sx = 0, sy = 0, cw = sw, ch = sh
  if (sw / sh > target) { cw = sh * target; sx = (sw - cw) / 2 }
  else { ch = sw / target; sy = ((sh - ch) / 2) * 0.72 }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, W, H)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the photo'))), 'image/jpeg', 0.86))
}

function fileToPortrait(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); toPortrait(img, img.width, img.height).then(resolve, reject) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')) }
    img.src = url
  })
}

function cameraError(e: unknown) {
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera access was blocked. Allow it in your browser settings, or choose a photo instead.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device.'
  return 'The camera could not be started.'
}

interface PhotoPanelProps {
  value: Blob | null
  onChange: (photo: Blob | null) => void
}

export function PhotoPanel({ value, onChange }: PhotoPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }
  useEffect(() => stopCamera, [])

  const pickFile = async (file: File | undefined) => {
    if (!file) return
    setProblem(null)
    try { onChange(await fileToPortrait(file)) } catch (e) { setProblem((e as Error).message) }
  }

  const openCamera = async () => {
    setProblem(null)
    if (!navigator.mediaDevices?.getUserMedia) { fileInput.current?.click(); return }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      setCameraOpen(true)
      requestAnimationFrame(() => { if (video.current) video.current.srcObject = stream.current })
    } catch (e) {
      setProblem(cameraError(e))
    }
  }

  const capture = async () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    onChange(await toPortrait(v, v.videoWidth, v.videoHeight))
    stopCamera()
    setCameraOpen(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">
        ፎቶግራፍ <span className="font-normal text-slate-500">· Photo</span>
      </h4>
      <p className="mt-1 text-xs text-slate-500">Optional. A head-and-shoulders portrait prints best on the ID card.</p>
      <div className="mx-auto mt-3 aspect-[4/5] w-40 overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
        {preview ? (
          <img src={preview} alt="Member photo preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">No photo yet<br />ፎቶ የለም</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
          <ImagePlus className="mr-1 h-4 w-4" aria-hidden /> Choose file
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={openCamera}>
          <Camera className="mr-1 h-4 w-4" aria-hidden /> Camera
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} aria-label="Remove photo">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      {problem && <p className="mt-2 text-xs text-red-600" role="alert">{problem}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        aria-label="Choose a photo"
        onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = '' }}
      />

      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) { stopCamera(); setCameraOpen(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take a photo</DialogTitle>
            <DialogDescription>Centre the face and shoulders, then press Capture.</DialogDescription>
          </DialogHeader>
          <video ref={video} autoPlay playsInline muted className="aspect-[4/5] w-full rounded-md bg-black object-cover" />
          <DialogFooter>
            <Button type="button" onClick={capture}>Capture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
