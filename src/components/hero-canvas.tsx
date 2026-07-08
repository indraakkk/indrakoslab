import { Component, Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import { ClientOnly } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

import type { HeroConfig } from '@/components/hero-scene'

/**
 * HeroCanvas — the interactive "glass" hero background.
 *
 * SSR-safe shell around the WebGL scene in `hero-scene.tsx` (three.js via
 * React Three Fiber). The R3F chunk is lazy-loaded on the client only, so
 * three.js never runs during prerender and stays out of the critical path;
 * a static CSS approximation of the scene (base gradient + teal gradation)
 * is what prerendered HTML ships, and it remains the fallback when WebGL
 * is unavailable. The canvas cross-fades in over it once the renderer is up.
 */

export interface HeroCanvasProps {
  /** Accent color of the gradation (design default: teal). */
  accentColor?: string
  /** Blade angle in degrees, -60..60. */
  angle?: number
  /** Flute (ridge) width in px, 14..120. */
  ridgeWidth?: number
  /** Refraction strength, 0.2..2.5. */
  refraction?: number
  /** Cursor interaction strength, 0..3. */
  cursorPower?: number
  /**
   * Pinned overrides for any tuned glass/scene parameter — paste the JSON
   * copied from the tune panel (dev only) to lock in a look.
   */
  glassConfig?: Partial<HeroConfig>
  className?: string
}

const HeroScene = lazy(() => import('@/components/hero-scene'))

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// CSS stand-in for the scene's organic-disc shape mask. Radii mirror the
// HeroConfig shape defaults' sizing contract — ry = shapeScale·height,
// rx = min(ry·shapeAspect, shapeMaxW·width) — so the fallback and the WebGL
// disc agree on portrait and ultrawide too (the hero is 100svh, so svh ≈ the
// element height); the long bottom melt is approximated by the soft outer stop
const FALLBACK_MASK =
  'radial-gradient(min(67.5svh, 62vw) 50svh at 50% 46%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 98%)'

/** If WebGL init or the chunk load fails, stay on the static fallback. */
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function HeroCanvas({
  accentColor = '#0F9D8C',
  angle = -10,
  ridgeWidth = 82,
  refraction = 1,
  cursorPower = 2,
  glassConfig,
  className,
}: HeroCanvasProps) {
  // flute stripe axis: CSS gradient angle = 90° + blade angle (default 80deg)
  const cssAngle = 90 + angle
  const rw = Math.max(14, ridgeWidth)
  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden', className)}
    >
      {/* static approximation of the scene — prerendered HTML, JS-off,
          and no-WebGL all land here; the canvas fades in over it */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, #ffffff 0%, #f5f6f9 60%, #edeff4 100%)',
        }}
      />
      {/* stripes + gradation confined to the shaped glass accent, mirroring
          the WebGL scene's organic-disc mask */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(${cssAngle}deg, rgba(30,36,46,0.055) 0px, rgba(255,255,255,0.32) ${rw * 0.05}px, rgba(255,255,255,0.07) ${rw * 0.12}px, rgba(255,255,255,0) ${rw * 0.5}px, rgba(30,36,46,0.03) ${rw * 0.85}px, rgba(30,36,46,0.08) ${rw}px), radial-gradient(min(67svh, 62vw) 34svh at 50% 46%, ${rgba(accentColor, 0.42)} 0%, ${rgba(accentColor, 0.16)} 55%, rgba(255,255,255,0) 78%)`,
          maskImage: FALLBACK_MASK,
          WebkitMaskImage: FALLBACK_MASK,
        }}
      />
      {/* bottom hand-off: the hero ends pure white so the (white) section
          below starts on the same background — mirrors the scene's pageFade */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '34%',
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #ffffff 88%)',
        }}
      />
      <ClientOnly fallback={null}>
        <SceneBoundary>
          <Suspense fallback={null}>
            <HeroScene
              accentColor={accentColor}
              angle={angle}
              ridgeWidth={ridgeWidth}
              refraction={refraction}
              cursorPower={cursorPower}
              glassConfig={glassConfig}
            />
          </Suspense>
        </SceneBoundary>
      </ClientOnly>
    </div>
  )
}
