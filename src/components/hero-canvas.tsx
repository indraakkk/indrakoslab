import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * HeroCanvas — the interactive "glass" hero background.
 *
 * Faithful port of the canvas engine from the Claude Design handoff
 * (design/project/Indrakoslab Hero.dc.html). The scene is drawn in a
 * rotated coordinate space (default -10°): discrete diagonal glass
 * "blades" in clusters (upper-left, center band, bottom, sparse right)
 * refract a single centered accent gradation that drifts slowly around
 * the middle with a breathing pulse and leans toward the cursor. Blades
 * near the pointer light up and extend; refraction ripples locally.
 *
 * Rendering pipeline per frame:
 *   1. `scene`  — offscreen, half-res: bright base + accent radial blobs
 *   2. `mask`   — offscreen: soft-ended blade shapes, flute-column aligned
 *   3. `ridge`  — offscreen: the scene refracted through vertical flutes
 *                 (cubic per-flute displacement), shaded by a tiled ridge
 *                 pattern, clipped by the mask
 *   4. main     — bright background, faint scene haze, rotated ridge layer
 *
 * Honors prefers-reduced-motion by rendering a single static frame.
 */

export interface HeroCanvasProps {
  /** Accent color of the gradation (design default: teal). */
  accentColor?: string
  /** Blade angle in degrees, -60..60. */
  angle?: number
  /** Flute (ridge) width in px, 14..72. */
  ridgeWidth?: number
  /** Refraction strength, 0.2..2.5. */
  refraction?: number
  /** Cursor interaction strength, 0..3. */
  cursorPower?: number
  className?: string
}

interface Blade {
  x: number
  y: number
  len: number
  w: number
  a: number
  ph: number
  sp: number
}

/** Deterministic blade clusters (seeded LCG, same layout as the design). */
function makeBlades(): Array<Blade> {
  let s = 41
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  const out: Array<Blade> = []
  const cluster = (
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    n: number,
    wMax: number,
  ) => {
    for (let k = 0; k < n; k++) {
      out.push({
        x: x0 + (x1 - x0) * rnd(),
        y: y0 + (y1 - y0) * rnd(),
        len: 0.22 + 0.38 * rnd(),
        w: 1 + Math.floor(rnd() * wMax),
        a: 0.5 + 0.5 * rnd(),
        ph: rnd() * Math.PI * 2,
        sp: 0.15 + 0.3 * rnd(),
      })
    }
  }
  // clusters like the reference: upper-left, center band, bottom, sparse right
  cluster(0.02, 0.3, 0.05, 0.5, 9, 3)
  cluster(0.28, 0.72, 0.3, 0.75, 11, 3)
  cluster(0.1, 0.55, 0.72, 1.05, 8, 3)
  cluster(0.74, 0.98, 0.05, 0.85, 5, 2)
  return out
}

function rgba(hex: string, a: number, mul = 1) {
  const n = parseInt(hex.slice(1), 16)
  return (
    'rgba(' +
    Math.round(((n >> 16) & 255) * mul) +
    ',' +
    Math.round(((n >> 8) & 255) * mul) +
    ',' +
    Math.round((n & 255) * mul) +
    ',' +
    a.toFixed(3) +
    ')'
  )
}

export function HeroCanvas({
  accentColor = '#0F9D8C',
  angle = -10,
  ridgeWidth = 68,
  refraction = 1,
  cursorPower = 2,
  className,
}: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scene = document.createElement('canvas')
    const sctx = scene.getContext('2d')!
    const ridge = document.createElement('canvas')
    const rctx = ridge.getContext('2d')!
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')!

    const blades = makeBlades()
    const th = (angle * Math.PI) / 180
    const cos = Math.cos(th)
    const sin = Math.sin(th)

    const ptr = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, act: 0, tact: 0 }
    let rp = { x: 0.5, y: 0.42 }

    let alive = true
    let raf = 0
    let lastFrame = performance.now()
    const t0 = performance.now()

    let dpr = 1
    let W = 2
    let H = 2
    let DW = 2
    let DH = 2
    let sw = 2
    let sh = 2
    const pad = 160
    let pattern: CanvasPattern | null = null
    let overlayW = 0

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animate = !media.matches

    const stripW = () => Math.max(12, ridgeWidth) * dpr

    function fit() {
      // rotated drawing region large enough to cover the canvas at the angle
      const a = Math.abs(th)
      const c = Math.cos(a)
      const s = Math.sin(a)
      DW = Math.ceil(W * c + H * s) + 8
      DH = Math.ceil(W * s + H * c) + 8
      // half-res offscreen scene, oversized horizontally so refraction never
      // samples out of bounds
      sw = Math.ceil(DW / 2) + pad * 2
      sh = Math.ceil(DH / 2)
      scene.width = sw
      scene.height = sh
      ridge.width = DW
      ridge.height = DH
      mask.width = DW
      mask.height = DH
    }

    function buildOverlay() {
      // one ridge's shading, tiled as a pattern across the canvas
      const w = Math.round(stripW())
      const c = document.createElement('canvas')
      c.width = w
      c.height = 2
      const cx = c.getContext('2d')!
      const g = cx.createLinearGradient(0, 0, w, 0)
      g.addColorStop(0.0, 'rgba(30,36,46,0.16)')
      g.addColorStop(0.045, 'rgba(255,255,255,0.55)')
      g.addColorStop(0.1, 'rgba(255,255,255,0.10)')
      g.addColorStop(0.5, 'rgba(255,255,255,0)')
      g.addColorStop(0.8, 'rgba(30,36,46,0.045)')
      g.addColorStop(0.965, 'rgba(30,36,46,0.10)')
      g.addColorStop(1.0, 'rgba(30,36,46,0.18)')
      cx.fillStyle = g
      cx.fillRect(0, 0, w, 2)
      pattern = ctx!.createPattern(c, 'repeat')
      overlayW = w
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(2, Math.round(rect.width * dpr))
      H = Math.max(2, Math.round(rect.height * dpr))
      canvas!.width = W
      canvas!.height = H
      fit()
      buildOverlay()
    }

    function blob(
      x: number,
      y: number,
      r: number,
      color: string,
      stretch?: number,
    ) {
      sctx.save()
      sctx.translate(x, y)
      sctx.scale(1, stretch || 1)
      const g = sctx.createRadialGradient(0, 0, 0, 0, 0, r)
      g.addColorStop(0, color)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      sctx.fillStyle = g
      sctx.fillRect(-r, -r, r * 2, r * 2)
      sctx.restore()
    }

    function drawScene(t: number) {
      const A = accentColor
      const base = sctx.createLinearGradient(0, 0, sw * 0.3, sh)
      base.addColorStop(0, '#ffffff')
      base.addColorStop(0.55, '#f3f4f8')
      base.addColorStop(1, '#e8ebf1')
      sctx.fillStyle = base
      sctx.fillRect(0, 0, sw, sh)

      // gentle parallax: the gradation leans toward the pointer
      const ox = (rp.x - 0.5) * sw * 0.1
      const oy = (rp.y - 0.5) * sh * 0.08

      // one centered radial gradation, drifting slowly around the middle
      const cx =
        sw * 0.5 +
        ox +
        sw * 0.045 * Math.sin(t * 0.11) +
        sw * 0.02 * Math.sin(t * 0.23 + 1.3)
      const cy =
        sh * 0.48 +
        oy +
        sh * 0.055 * Math.cos(t * 0.13) +
        sh * 0.025 * Math.sin(t * 0.19 + 0.6)
      const br = 1 + 0.05 * Math.sin(t * 0.17) // slow breathing

      blob(cx, cy, sw * 0.44 * br, rgba(A, 0.34), 1.12) // wide halo
      blob(cx, cy, sw * 0.27 * br, rgba(A, 0.55), 1.25) // saturated mid
      blob(
        // deep core, counter-drift
        cx + sw * 0.03 * Math.sin(t * 0.09 + 2),
        cy + sh * 0.02 * Math.cos(t * 0.12),
        sw * 0.115 * br,
        rgba(A, 0.62, 0.42),
        1.45,
      )
      blob(
        // faint bright center
        cx - sw * 0.015 * Math.sin(t * 0.14),
        cy - sh * 0.01 * Math.cos(t * 0.1),
        sw * 0.04,
        'rgba(255,255,255,0.55)',
        1.3,
      )
    }

    function drawMask(t: number) {
      // soft-ended blade shapes, column-aligned to the flutes; cursor
      // proximity lights them up
      const sWidth = stripW()
      const act = ptr.act
      mctx.clearRect(0, 0, DW, DH)
      for (const b of blades) {
        const col = Math.round((b.x * DW) / sWidth)
        const x = col * sWidth
        const w = b.w * sWidth
        const gx = Math.exp(
          -Math.pow(x + w / 2 - rp.x * DW, 2) / (2 * Math.pow(DW * 0.09, 2)),
        )
        const gy = Math.exp(
          -Math.pow((b.y - rp.y) * DH, 2) / (2 * Math.pow(DH * 0.22, 2)),
        )
        const g = gx * gy * act * cursorPower
        const breathe = 0.55 + 0.45 * Math.sin(t * b.sp + b.ph)
        const alpha = Math.min(1, b.a * breathe + 0.75 * g)
        if (alpha < 0.01) continue
        const len = DH * b.len * (1 + 0.35 * g)
        const y0 = b.y * DH - len / 2
        const lg = mctx.createLinearGradient(0, y0, 0, y0 + len)
        lg.addColorStop(0, 'rgba(255,255,255,0)')
        lg.addColorStop(0.32, 'rgba(255,255,255,' + alpha.toFixed(3) + ')')
        lg.addColorStop(0.68, 'rgba(255,255,255,' + alpha.toFixed(3) + ')')
        lg.addColorStop(1, 'rgba(255,255,255,0)')
        mctx.fillStyle = lg
        mctx.fillRect(x, y0, w, len)
      }
    }

    function loop(now: number) {
      if (!alive) return
      lastFrame = now
      const t = (now - t0) / 1000
      ptr.x += (ptr.tx - ptr.x) * 0.06
      ptr.y += (ptr.ty - ptr.y) * 0.06
      ptr.act += (ptr.tact - ptr.act) * 0.04

      // pointer mapped into the rotated drawing space (normalized)
      const dx = (ptr.x - 0.5) * W
      const dy = (ptr.y - 0.5) * H
      rp = {
        x: (dx * cos + dy * sin + DW / 2) / DW,
        y: (-dx * sin + dy * cos + DH / 2) / DH,
      }

      drawScene(t)
      drawMask(t)

      const sWidth = stripW()
      if (Math.round(sWidth) !== overlayW) buildOverlay()
      const sub = Math.max(2, Math.round(sWidth / 9))
      const px = rp.x * DW
      const sigma = DW * 0.11

      // refract the scene into the ridge layer (its native space is the
      // rotated rect)
      rctx.globalCompositeOperation = 'source-over'
      rctx.clearRect(0, 0, DW, DH)
      for (let x = 0; x < DW; x += sub) {
        const i = Math.floor(x / sWidth)
        const u = ((x % sWidth) / sWidth) * 2 - 1
        const g =
          Math.exp(-((x - px) * (x - px)) / (2 * sigma * sigma)) * ptr.act
        const amp =
          sWidth *
          0.62 *
          refraction *
          (0.55 + 0.45 * Math.sin(t * 0.35 + i * 0.8)) *
          (1 + 0.9 * cursorPower * g)
        const off = amp * u * u * u
        const sx = pad + (x + off) / 2
        rctx.drawImage(scene, sx, 0, sub / 2, sh, x, 0, sub, DH)
      }
      if (pattern) {
        rctx.fillStyle = pattern
        rctx.fillRect(0, 0, DW, DH)
      }
      // keep the glass only where the blade mask lives
      rctx.globalCompositeOperation = 'destination-in'
      rctx.drawImage(mask, 0, 0)
      rctx.globalCompositeOperation = 'source-over'

      // composite: bright base, faint haze, then the masked blades
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.clearRect(0, 0, W, H)
      const bg = ctx!.createLinearGradient(0, 0, W * 0.25, H)
      bg.addColorStop(0, '#ffffff')
      bg.addColorStop(0.6, '#f5f6f9')
      bg.addColorStop(1, '#edeff4')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)
      ctx!.save()
      ctx!.translate(W / 2, H / 2)
      ctx!.rotate(th)
      ctx!.translate(-DW / 2, -DH / 2)
      ctx!.globalAlpha = 0.16
      ctx!.drawImage(scene, pad, 0, sw - pad * 2, sh, 0, 0, DW, DH)
      ctx!.globalAlpha = 1
      ctx!.drawImage(ridge, 0, 0)
      ctx!.restore()

      if (animate) raf = requestAnimationFrame(loop)
    }

    function begin() {
      resize()
      cancelAnimationFrame(raf)
      lastFrame = performance.now()
      raf = requestAnimationFrame(loop)
    }

    const onResize = () => begin()
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      if (r.width === 0) return
      ptr.tx = (e.clientX - r.left) / r.width
      ptr.ty = (e.clientY - r.top) / r.height
      ptr.tact = 1
    }
    const onLeave = () => {
      ptr.tact = 0
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') begin()
    }
    const onMotionChange = () => {
      animate = !media.matches
      begin()
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', onVis)
    media.addEventListener('change', onMotionChange)

    begin()

    // watchdog: if the canvas was sized while hidden (rect was 0x0), layout
    // drifted, or the raf chain died, restart instead of staying blank/blurry
    const watchdog = setInterval(() => {
      if (!alive) return
      const rect = canvas.getBoundingClientRect()
      const d = Math.min(window.devicePixelRatio || 1, 2)
      if (rect.width > 0 && Math.abs(Math.round(rect.width * d) - W) > 4) {
        // under reduced motion nothing repaints after resize(), so run a
        // full begin() to draw one fresh static frame
        if (animate) resize()
        else begin()
      }
      if (animate && performance.now() - lastFrame > 1600) {
        cancelAnimationFrame(raf)
        lastFrame = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }, 2000)

    return () => {
      alive = false
      clearInterval(watchdog)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
      media.removeEventListener('change', onMotionChange)
    }
  }, [accentColor, angle, ridgeWidth, refraction, cursorPower])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('absolute inset-0 block h-full w-full', className)}
    />
  )
}
