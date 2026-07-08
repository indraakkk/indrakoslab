import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal as createDomPortal } from 'react-dom'
import {
  Canvas,
  createPortal,
  useFrame,
  useThree,
} from '@react-three/fiber'
import { MeshTransmissionMaterial, useFBO } from '@react-three/drei'
import * as THREE from 'three'

import type { CSSProperties } from 'react'
import type { RootState } from '@react-three/fiber'

/**
 * HeroScene — the WebGL (three.js / R3F) fluted-glass hero.
 *
 * Architecture (the pmndrs "lens refraction" technique, adapted to fluted
 * architectural glass):
 *
 *   1. A procedural background scene — the Claude Design gradation: bright
 *      base gradient, a drifting/breathing teal radial gradation whose accent
 *      hue is slowly animated per-frame, and the seeded field of glass-blade
 *      streaks — renders into an offscreen FBO every frame (`BgQuad`,
 *      portalled into its own THREE.Scene). The gradation and the blades are
 *      confined to a soft organic-disc mask (`shapeMask`) so the page outside
 *      the glass stays a calm base gradient; the unrefracted buffer is also
 *      what the main scene shows around the glass. The buffer's bottom span
 *      blends to pure #ffffff (`pageFade`) so the hero hands off seamlessly
 *      to the white section below.
 *   2. A shaped fluted-glass accent — a centered organic disc of cos^k flute
 *      domes with analytic normals, whose flute depth and per-vertex opacity
 *      both melt away at an irregular rim (and melt longer across the lower
 *      rim, dissolving the effect into the section below) — refracts that
 *      buffer through drei's MeshTransmissionMaterial: per-flute lensing,
 *      IOR-spread chromatic aberration, anisotropic frosting, and studio-strip
 *      reflections from a locally generated PMREM environment (no network).
 *
 * MTM's frost is a train of `samples` discrete taps along the refraction ray,
 * jittered per-pixel by a static hash of gl_FragCoord — too few samples over
 * a long smear renders as ghost copies ("double lines") plus per-pixel grain
 * ("jitter"), so `samples` stays high by default and is exposed for tuning.
 *
 * The flutes are oriented to match `repeating-linear-gradient(80deg, …)`:
 * CSS gradient angle = 90° + `angle`, so the default angle=-10 puts the
 * stripe axis at 80deg — stripes lean top-left. The background blade streaks
 * share the same rotation so everything stays parallel.
 *
 * Every visual parameter lives in a `HeroConfig` — a floating tune panel
 * (portalled to <body>, dev only) edits it live and copies the JSON, which
 * can be pinned via the `glassConfig` prop.
 *
 * Honors prefers-reduced-motion (single static frame) and pauses off-screen.
 */

export interface HeroSceneProps {
  /** Accent color of the gradation (design default: teal). */
  accentColor?: string
  /** Stripe tilt in degrees; -10 ≡ repeating-linear-gradient(80deg). */
  angle?: number
  /** Flute (ridge) width in CSS px, 14..120. */
  ridgeWidth?: number
  /** Refraction strength — scales the default thickness + dispersion. */
  refraction?: number
  /** Cursor interaction strength, 0..3. */
  cursorPower?: number
  /** Pinned overrides for any tuned parameter (paste from the tune panel). */
  glassConfig?: Partial<HeroConfig>
}

/** Every knob of the scene — edited live by the tune panel. */
export interface HeroConfig {
  // glass material
  thickness: number
  ior: number
  chromaticAberration: number
  anisotropicBlur: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  samples: number
  distortion: number
  distortionScale: number
  // flute geometry
  ridgeWidth: number
  angle: number
  /** Dome height as a fraction of flute width. */
  depth: number
  /** Profile exponent: z = depth·cos^k — <1 steep walls, 1 crease, >1 smooth. */
  seamCurve: number
  // shape — the glass-accent silhouette (viewport fractions / radius fractions)
  shapeX: number
  shapeY: number
  /** Vertical radius as a fraction of the viewport height. */
  shapeScale: number
  /** Horizontal radius = vertical radius · aspect (before the width cap). */
  shapeAspect: number
  /** Horizontal-radius cap as a fraction of the viewport width — keeps the
   *  disc's side margins on portrait/narrow screens. */
  shapeMaxW: number
  /** Rim feather width as a fraction of the radius. */
  shapeSoft: number
  /** Organic rim-radius wobble amplitude. */
  shapeWobble: number
  /** Extra feather on the lower rim — the scroll hand-off dissolve. */
  bottomFeather: number
  /** Gradation/blade mask size relative to the glass disc. */
  contentScale: number
  /** Bottom span of the viewport that blends to pure #ffffff — the seamless
   *  hand-off into the white section below the hero. */
  pageFade: number
  // light + environment
  envMapIntensity: number
  envLevel: number
  envBlur: number
  lightIntensity: number
  // background
  accentColor: string
  blobStrength: number
  haze: number
  bladeStrength: number
  // motion
  idleSpeed: number
  idleDrift: number
  cursorPower: number
}

function makeDefaults(
  accentColor: string,
  angle: number,
  ridgeWidth: number,
  refraction: number,
  cursorPower: number,
): HeroConfig {
  return {
    thickness: 1.89 * refraction,
    ior: 1.22,
    chromaticAberration: 0.06 * refraction,
    anisotropicBlur: 0.55,
    roughness: 0.16,
    clearcoat: 0.12,
    clearcoatRoughness: 0.35,
    samples: 16,
    distortion: 0,
    distortionScale: 0.5,
    ridgeWidth,
    angle,
    depth: 0.5,
    seamCurve: 1.4,
    shapeX: 0.5,
    shapeY: 0.46,
    shapeScale: 0.5,
    shapeAspect: 1.35,
    shapeMaxW: 0.62,
    shapeSoft: 0.3,
    shapeWobble: 0.1,
    bottomFeather: 0.35,
    contentScale: 0.95,
    pageFade: 0.32,
    envMapIntensity: 1,
    envLevel: 1,
    envBlur: 0.35,
    lightIntensity: 0.6,
    accentColor,
    blobStrength: 1,
    haze: 0.26,
    bladeStrength: 1,
    idleSpeed: 1,
    idleDrift: 1,
    cursorPower,
  }
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

const BLADES = makeBlades()
const NB = BLADES.length

const CAM_Z = 20
const GLASS_Z = 4

/** Design-space (raw sRGB) color helpers — no THREE color management. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h / 6, s, l]
}

function hue(p: number, q: number, t: number) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  h = ((h % 1) + 1) % 1
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)]
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

// ---------------------------------------------------------------------------
// Background scene — rendered to an FBO, then refracted by the glass pane.
// ---------------------------------------------------------------------------

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;    // buffer size, device px (y-down space in the math)
uniform vec2 uDraw;   // rotated drawing-region size (DW, DH)
uniform vec2 uScene;  // procedural scene size (sw, sh) — half-res + padding
uniform float uCos;   // cos(blade angle)
uniform float uSin;   // sin(blade angle)
uniform vec3 uAccent; // animated per frame on the CPU
uniform float uHaze;  // gradation haze strength outside the blades
uniform float uGain;  // gradation blob intensity multiplier

// per-frame CPU-computed scene state (see useFrame)
uniform vec4 uBlobCA; // gradation center (xy) + deep-core center (zw)
uniform vec2 uBlobCB; // bright-center blob position
uniform vec4 uBlobR;  // radii: halo, mid, core, bright (scene units)
uniform vec4 uBladesA[${NB}];      // x0, width, y0, length (drawing px)
uniform float uBladesAlpha[${NB}]; // per-blade alpha this frame

uniform vec2 uShapeC;         // organic-disc center (buffer px, y-down)
uniform vec2 uShapeR;         // disc radii (buffer px)
uniform float uShapeSoft;     // rim feather width (fraction of the radius)
uniform float uShapeWobble;   // low-frequency rim wobble (organic silhouette)
uniform float uBottomFeather; // extra feather on the lower rim (scroll hand-off)
uniform float uContentScale;  // content mask size relative to the glass disc
uniform float uPageFade;      // bottom span that blends to pure page white

const float PAD = 160.0; // scene-canvas horizontal padding (scene units)

// Soft organic-disc mask, 1 inside → 0 past the rim. The rim radius wobbles
// with three low harmonics for an organic silhouette, and the feather widens
// toward the bottom so the content dissolves into the page below. The vivid
// gradation and the blades only exist inside it — outside stays the calm
// page. Must stay in lockstep with shapeMaskJS() (the glass geometry).
float shapeMask(vec2 p, float scale) {
  vec2 q = (p - uShapeC) / (uShapeR * scale);
  float r = length(q);
  float phi = atan(q.y, q.x);
  float wob = 1.0 + uShapeWobble
    * (0.55 * sin(2.0 * phi + 0.9) + 0.30 * sin(3.0 * phi + 2.4) + 0.15 * sin(5.0 * phi + 4.2));
  float t = r / max(wob, 1e-3);
  float dn = max(q.y, 0.0) / max(r, 1e-4); // 1 straight down, 0 sideways/up
  float inner = clamp(1.0 - (uShapeSoft + uBottomFeather * dn), 0.02, 0.98);
  return 1.0 - smoothstep(inner, 1.0, t);
}

// Canvas-2D radial gradient: color -> rgba(255,255,255,0); both rgb and
// alpha interpolate, so the falloff whitens as it fades.
vec3 blob(vec3 col, vec2 s, vec2 c, float r, vec3 rgb, float a, float stretch) {
  vec2 d = s - c;
  d.y /= stretch;
  float f = clamp(length(d) / r, 0.0, 1.0);
  return mix(col, mix(rgb, vec3(1.0), f), clamp(a, 0.0, 1.0) * (1.0 - f));
}

// The offscreen "scene": bright base gradient + drifting accent gradation.
// s is in scene units (half drawing-space resolution, PAD-padded in x).
vec3 sceneColor(vec2 s) {
  vec2 g = vec2(uScene.x * 0.3, uScene.y);
  float tt = clamp(dot(s, g) / dot(g, g), 0.0, 1.0);
  vec3 col = tt < 0.55
    ? mix(vec3(1.0), vec3(0.95294, 0.95686, 0.97255), tt / 0.55)
    : mix(vec3(0.95294, 0.95686, 0.97255), vec3(0.90980, 0.92157, 0.94510), (tt - 0.55) / 0.45);

  col = blob(col, s, uBlobCA.xy, uBlobR.x, uAccent, 0.52 * uGain, 1.12); // wide halo
  col = blob(col, s, uBlobCA.xy, uBlobR.y, uAccent, 0.85 * uGain, 1.25); // saturated mid
  col = blob(col, s, uBlobCA.zw, uBlobR.z, uAccent * 0.34, 0.80 * uGain, 1.45); // deep core
  col = blob(col, s, uBlobCB, uBlobR.w, vec3(1.0), 0.50 * uGain, 1.30); // bright center
  return col;
}

// Page background under the glass (main-canvas gradient of the 2D port).
vec3 bgGrad(vec2 p) {
  vec2 g = vec2(uRes.x * 0.25, uRes.y);
  float tt = clamp(dot(p, g) / dot(g, g), 0.0, 1.0);
  return tt < 0.6
    ? mix(vec3(1.0), vec3(0.96078, 0.96471, 0.97647), tt / 0.6)
    : mix(vec3(0.96078, 0.96471, 0.97647), vec3(0.92941, 0.93725, 0.95686), (tt - 0.6) / 0.4);
}

void main() {
  // canvas 2D is y-down; flip so every constant matches the 2D port
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  // into the rotated drawing space (blades stay parallel to the flutes)
  vec2 d = p - uRes * 0.5;
  vec2 q = vec2(d.x * uCos + d.y * uSin, -d.x * uSin + d.y * uCos) + uDraw * 0.5;
  q = clamp(q, vec2(0.0), uDraw);

  vec3 col = bgGrad(p);

  // everything vivid is confined to the glass shape; outside stays the page
  float cm = shapeMask(p, uContentScale);

  // the vivid gradation: soft haze in the shape, full-strength in the blades
  vec3 scn = sceneColor(vec2(PAD + q.x * 0.5, q.y * 0.5));
  col = mix(col, scn, uHaze * cm);

  // ---- blade mask (per-blade state precomputed on the CPU) ---------------
  float mask = 0.0;
  float tip = 0.0;
  if (cm > 0.001) for (int i = 0; i < ${NB}; i++) {
    vec4 A = uBladesA[i];
    // horizontal coverage, 1px antialiased
    float hx = smoothstep(A.x - 1.0, A.x + 1.0, q.x)
      * (1.0 - smoothstep(A.x + A.y - 1.0, A.x + A.y + 1.0, q.x));
    if (hx <= 0.0) continue;

    float ty = (q.y - A.z) / A.w;
    if (ty <= 0.0 || ty >= 1.0) continue;

    // soft-ended vertical profile (long luminous bars with fading tips)
    float ramp = clamp(min(ty, 1.0 - ty) / 0.38, 0.0, 1.0);
    float a = uBladesAlpha[i] * ramp * hx;
    mask = mask + a * (1.0 - mask); // source-over accumulate

    // glass-edge glint where the blade fades out
    tip += (1.0 - ramp) * a;
  }

  // blades lean saturated — the bars must stay vivid through the frosting
  vec3 bladeCol = mix(scn, uAccent, 0.20);
  col = mix(col, bladeCol, mask * cm);
  col += vec3(1.0) * tip * 0.16 * cm;

  // static film grain — dithers the long soft gradients band-free without
  // any per-frame flicker (the frost smear would amplify temporal noise)
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * (2.0 / 255.0);

  // hand-off into the (pure white) section below the hero: the bottom span
  // blends to exact #ffffff — grain included, so the last rows carry no
  // dither and the seam color matches the next section precisely
  float pf = smoothstep(0.985 - max(uPageFade, 1e-4), 0.985, p.y / uRes.y);
  col = mix(col, vec3(1.0), pf);

  gl_FragColor = vec4(col, 1.0);
}
`

type BgUniforms = {
  uRes: { value: THREE.Vector2 }
  uDraw: { value: THREE.Vector2 }
  uScene: { value: THREE.Vector2 }
  uCos: { value: number }
  uSin: { value: number }
  uAccent: { value: THREE.Vector3 }
  uHaze: { value: number }
  uGain: { value: number }
  uBlobCA: { value: THREE.Vector4 }
  uBlobCB: { value: THREE.Vector2 }
  uBlobR: { value: THREE.Vector4 }
  uBladesA: { value: Array<THREE.Vector4> }
  uBladesAlpha: { value: Float32Array }
  uShapeC: { value: THREE.Vector2 }
  uShapeR: { value: THREE.Vector2 }
  uShapeSoft: { value: number }
  uShapeWobble: { value: number }
  uBottomFeather: { value: number }
  uContentScale: { value: number }
  uPageFade: { value: number }
}

function makeBgUniforms(): BgUniforms {
  return {
    uRes: { value: new THREE.Vector2(2, 2) },
    uDraw: { value: new THREE.Vector2(2, 2) },
    uScene: { value: new THREE.Vector2(2, 2) },
    uCos: { value: 1 },
    uSin: { value: 0 },
    uAccent: { value: new THREE.Vector3(0, 0.6, 0.55) },
    uHaze: { value: 0.26 },
    uGain: { value: 1 },
    uBlobCA: { value: new THREE.Vector4() },
    uBlobCB: { value: new THREE.Vector2() },
    uBlobR: { value: new THREE.Vector4(1, 1, 1, 1) },
    uBladesA: { value: BLADES.map(() => new THREE.Vector4()) },
    uBladesAlpha: { value: new Float32Array(NB) },
    uShapeC: { value: new THREE.Vector2(1, 1) },
    uShapeR: { value: new THREE.Vector2(1, 1) },
    uShapeSoft: { value: 0.3 },
    uShapeWobble: { value: 0.1 },
    uBottomFeather: { value: 0.35 },
    uContentScale: { value: 0.95 },
    uPageFade: { value: 0.32 },
  }
}

function BgQuad({ uniforms }: { uniforms: BgUniforms }) {
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Shaped fluted glass — cos^k flute domes melting away at an organic rim.
// ---------------------------------------------------------------------------

/**
 * Soft organic-disc mask, 1 inside → 0 past the rim. (qx, qy) is the point
 * in shape-normalized screen space ((p − center) / radii, y-down). The rim
 * radius wobbles with three low harmonics for an organic silhouette, and the
 * feather widens toward the bottom (`bottomFeather`) so the glass dissolves
 * into the page below instead of ending on a line. Must stay in lockstep
 * with shapeMask() in FRAG — the same mask confines the background content.
 */
function shapeMaskJS(
  qx: number,
  qy: number,
  soft: number,
  wobble: number,
  bottomFeather: number,
): number {
  const r = Math.hypot(qx, qy)
  const phi = Math.atan2(qy, qx)
  const wob =
    1 +
    wobble *
      (0.55 * Math.sin(2 * phi + 0.9) +
        0.3 * Math.sin(3 * phi + 2.4) +
        0.15 * Math.sin(5 * phi + 4.2))
  const t = r / Math.max(wob, 1e-3)
  const dn = Math.max(qy, 0) / Math.max(r, 1e-4)
  const inner = Math.min(Math.max(1 - (soft + bottomFeather * dn), 0.02), 0.98)
  const e = Math.min(1, Math.max(0, (t - inner) / (1 - inner)))
  return 1 - e * e * (3 - 2 * e)
}

interface FlutedGlassOpts {
  /** Flute width, world units. */
  fw: number
  /** Shape radii, world units (x: screen-horizontal, y: screen-vertical). */
  rx: number
  ry: number
  /** Mesh z-rotation — the mask is evaluated in the unrotated screen frame. */
  rotZ: number
  /** Dome height as a fraction of flute width. */
  depthF: number
  /** cos^k profile exponent. */
  seamK: number
  soft: number
  wobble: number
  bottomFeather: number
}

/**
 * The shaped glass accent: a grid heightfield of cos^k flute domes
 * (z = depth·fw·cos^k(π·s/2), s ∈ [-1, 1] across each flute) whose flute
 * depth AND per-vertex opacity (RGBA vertex colors — the material renders
 * with vertexColors + transparent) both follow shapeMaskJS(): full glass in
 * the disc core, melting to flat-and-invisible past the rim. Opacity holds
 * a touch longer than flute depth so the melt ends as plain glass fading
 * out, not a popping edge — and it reaches exactly 0 strictly inside the
 * pane bounds, so the mesh boundary can never show against the backdrop.
 *
 * Normals are analytic: dz/dx from the flute profile times the envelope,
 * plus the (numeric) envelope gradient times the profile height.
 * k (`seamCurve`) shapes the seam: <1 steep near-vertical walls (two
 * grazing lines per seam — the "double line" look), 1 a single sharp
 * crease, >1 a smooth reeded wave with one soft line per seam.
 */
function buildFlutedGlassGeometry({
  fw,
  rx,
  ry,
  rotZ,
  depthF,
  seamK,
  soft,
  wobble,
  bottomFeather,
}: FlutedGlassOpts): THREE.BufferGeometry {
  const DEPTH = fw * depthF
  const halfW = fw / 2
  const cosR = Math.cos(rotZ)
  const sinR = Math.sin(rotZ)

  // pane sized to the rotated ellipse's bbox in the local frame, padded so
  // the mask (and with it the vertex alpha) hits 0 before the pane edge
  const pad = 1 + wobble + 0.05
  const hx = Math.hypot(rx * cosR, ry * sinR) * pad + fw
  const hy = Math.hypot(rx * sinR, ry * cosR) * pad + fw
  // even count pins a flute seam to x=0, so the pattern can't snap sideways
  // by half a flute when a resize or slider drag flips the count's parity
  const count = Math.max(2, 2 * Math.ceil(hx / fw))
  const gw = count * fw
  const gh = 2 * hy

  // vertex budget — extreme shape × flute combos (tiny flutes over a huge
  // disc) would otherwise allocate millions of vertices in one synchronous
  // rebuild; shed per-flute columns and rows gracefully instead
  let SEG = 32 // columns per flute
  let ROWS = 96 // rows along the flutes — the rim + bottom melt live here
  const est = (count * SEG + 1) * (ROWS + 1)
  if (est > 160_000) {
    const s = Math.sqrt(160_000 / est)
    SEG = Math.max(8, Math.floor(SEG * s))
    ROWS = Math.max(32, Math.floor(ROWS * s))
  }
  const cols = count * SEG

  // flute-depth envelope, evaluated in the (unrotated) screen frame;
  // world y is up while the mask convention is CSS y-down, hence -sy
  const env = (x: number, y: number) => {
    const sx = x * cosR - y * sinR
    const sy = x * sinR + y * cosR
    return shapeMaskJS(sx / rx, -sy / ry, soft, wobble, bottomFeather)
  }
  const h = fw * 0.25 // numeric-gradient step for the envelope

  // per-column flute profile: height + slope, both before the envelope
  const profZ = new Float64Array(cols + 1)
  const profS = new Float64Array(cols + 1)
  for (let ix = 0; ix <= cols; ix++) {
    const x01 = (ix % SEG) / SEG // 0..1 across the flute (0 at seams)
    const s = x01 * 2 - 1 // -1..1 across the dome
    const c = Math.cos((Math.PI * s) / 2)
    if (c > 1e-4) {
      profZ[ix] = DEPTH * Math.pow(c, seamK)
      profS[ix] =
        (-DEPTH *
          seamK *
          Math.pow(c, seamK - 1) *
          Math.sin((Math.PI * s) / 2) *
          (Math.PI / 2)) /
        halfW
    }
  }

  const vpr = cols + 1
  const nV = vpr * (ROWS + 1)
  const pos = new Float32Array(nV * 3)
  const nrm = new Float32Array(nV * 3)
  const rgba = new Float32Array(nV * 4)
  const uvA = new Float32Array(nV * 2)
  const alpha = new Float32Array(nV)
  const idx = new Uint32Array(cols * ROWS * 6)

  for (let iy = 0; iy <= ROWS; iy++) {
    const y = (iy / ROWS) * gh - gh / 2
    for (let ix = 0; ix <= cols; ix++) {
      const x = (ix / cols) * gw - gw / 2
      const E = env(x, y)
      let z = 0
      let dzdx = 0
      let dzdy = 0
      if (E > 0) {
        const Ex = (env(x + h, y) - env(x - h, y)) / (2 * h)
        const Ey = (env(x, y + h) - env(x, y - h)) / (2 * h)
        z = profZ[ix] * E
        dzdx = profS[ix] * E + Ex * profZ[ix]
        dzdy = Ey * profZ[ix]
      }
      const inv = 1 / Math.hypot(dzdx, dzdy, 1)
      const a = Math.pow(E, 0.55)
      const v = iy * vpr + ix
      pos[v * 3] = x
      pos[v * 3 + 1] = y
      pos[v * 3 + 2] = z
      nrm[v * 3] = -dzdx * inv
      nrm[v * 3 + 1] = -dzdy * inv
      nrm[v * 3 + 2] = inv
      alpha[v] = a
      rgba[v * 4] = 1
      rgba[v * 4 + 1] = 1
      rgba[v * 4 + 2] = 1
      rgba[v * 4 + 3] = a
      uvA[v * 2] = ix / cols
      uvA[v * 2 + 1] = iy / ROWS
    }
  }

  // emit only quads that can contribute — fully transparent cells (the pane
  // corners outside the disc) never even reach the fragment shader
  let n = 0
  for (let iy = 0; iy < ROWS; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const a = iy * vpr + ix
      const b = a + 1
      const c = a + vpr
      const d = c + 1
      if (alpha[a] > 0 || alpha[b] > 0 || alpha[c] > 0 || alpha[d] > 0) {
        idx[n] = a
        idx[n + 1] = b
        idx[n + 2] = c
        idx[n + 3] = b
        idx[n + 4] = d
        idx[n + 5] = c
        n += 6
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvA, 2))
  geo.setIndex(new THREE.BufferAttribute(idx.slice(0, n), 1))
  return geo
}

/**
 * Studio-strip PMREM environment, generated locally (no network): thin bright
 * strips on near-black, so flute crests catch streak highlights while seams
 * reflect darkness. `blur` (PMREM sigma) feathers the strips — sharper strips
 * alias into stair-steps on the diagonal crest lines, so keep some blur.
 */
function useStudioEnvironment(blur: number, level: number) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = new THREE.Scene()
    env.background = new THREE.Color('#0b0d10')
    const meshes: Array<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>> = []
    const strip = (
      w: number,
      h: number,
      color: string,
      intensity: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(intensity),
          side: THREE.DoubleSide,
        }),
      )
      m.position.set(x, y, z)
      m.lookAt(0, 0, 0)
      env.add(m)
      meshes.push(m)
    }
    strip(12, 1.4, '#ffffff', 7 * level, 0, 6, 4) // key strip, overhead-front
    strip(2, 9, '#dfe7f2', 2.2 * level, -7, 1, 2) // cool left fill
    strip(1.6, 8, '#cdeee6', 1.8 * level, 7, -2, 2) // teal-tinted right kicker
    const rt = pmrem.fromScene(env, blur)
    scene.environment = rt.texture
    return () => {
      scene.environment = null
      for (const m of meshes) {
        m.geometry.dispose()
        m.material.dispose()
      }
      rt.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, blur, level])
}

// ---------------------------------------------------------------------------
// Scene wiring
// ---------------------------------------------------------------------------

interface SceneProps {
  cfg: HeroConfig
  /** Render a single static t=0 frame instead of animating. */
  reduced: boolean
}

function Scene({ cfg, reduced }: SceneProps) {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)

  const [bgScene] = useState(() => new THREE.Scene())
  // the background buffer the glass refracts AND the visible page around it
  // — CSS resolution, not device resolution (¼ the pixels at dpr 2): the
  // frost smear hides the upscale inside the glass, the page outside is long
  // soft gradients (the grain dither just softens a touch at dpr > 1), and
  // the 33-blade fragment loop runs on far fewer pixels
  const buffer = useFBO(size.width, size.height, {
    type: THREE.UnsignedByteType,
    depthBuffer: false,
  })

  const uniforms = useMemo(() => makeBgUniforms(), [])
  const tiltRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.DirectionalLight>(null)

  const ptr = useRef({ x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, act: 0, tact: 0 })
  // own accumulator — R3F's setFrameloop() zeroes the shared clock on every
  // frameloop change, which would snap the composition on pause/resume
  const tRef = useRef(0)

  const baseHsl = useMemo(
    () => rgbToHsl(...hexToRgb(cfg.accentColor)),
    [cfg.accentColor],
  )

  useStudioEnvironment(cfg.envBlur, cfg.envLevel)

  // pointer tracking on the window, exactly like the 2D port
  useEffect(() => {
    const canvas = gl.domElement
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      if (r.width === 0) return
      const P = ptr.current
      P.tx = (e.clientX - r.left) / r.width
      P.ty = (e.clientY - r.top) / r.height
      P.tact = 1
    }
    const onLeave = () => {
      ptr.current.tact = 0
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [gl])

  // the shaped glass accent, in world units at its depth
  const glassScaleF = (CAM_Z - GLASS_Z) / CAM_Z
  const worldPerPx = (viewport.width * glassScaleF) / size.width
  // stripe axis at (90 + angle)deg CSS — angle=-10 ≡ repeating-linear-gradient(80deg)
  const rotZ = (-cfg.angle * Math.PI) / 180
  // ry tracks the viewport HEIGHT (not min(w,h)) so the bottom melt lands
  // near the hero bottom on portrait too; rx is capped by the width so the
  // disc keeps side margins on narrow screens
  const ryW = cfg.shapeScale * size.height * worldPerPx
  const rxW = Math.min(
    ryW * cfg.shapeAspect,
    cfg.shapeMaxW * size.width * worldPerPx,
  )
  const shapeCX = (cfg.shapeX - 0.5) * viewport.width * glassScaleF
  const shapeCY = -(cfg.shapeY - 0.5) * viewport.height * glassScaleF

  const geoParams = useMemo<FlutedGlassOpts>(
    () => ({
      fw: Math.max(14, cfg.ridgeWidth) * worldPerPx,
      rx: rxW,
      ry: ryW,
      rotZ,
      depthF: cfg.depth,
      seamK: cfg.seamCurve,
      soft: cfg.shapeSoft,
      wobble: cfg.shapeWobble,
      bottomFeather: cfg.bottomFeather,
    }),
    [
      worldPerPx,
      rxW,
      ryW,
      rotZ,
      cfg.ridgeWidth,
      cfg.depth,
      cfg.seamCurve,
      cfg.shapeSoft,
      cfg.shapeWobble,
      cfg.bottomFeather,
    ],
  )
  // deferred: slider drags and live resizes re-render at input priority with
  // the previous geometry, and the rebuild runs in a low-priority pass —
  // React skips intermediate values when rebuilds can't keep up with events
  const deferredGeo = useDeferredValue(geoParams)
  const geometry = useMemo(
    () => buildFlutedGlassGeometry(deferredGeo),
    [deferredGeo],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    const u = uniforms
    // all background math runs in buffer pixels, whatever its scale
    const W = Math.max(2, buffer.width)
    const H = Math.max(2, buffer.height)
    const pxPerCss = W / Math.max(2, state.size.width)

    const dt = Math.min(delta, 0.1)
    if (!reduced) tRef.current += dt
    const t = reduced ? 0 : tRef.current
    // idle time — everything that must visibly live without a cursor
    const ts = t * cfg.idleSpeed
    const drift = cfg.idleDrift

    // framerate-independent smoothing matched to the port's 0.06/0.04 @60fps
    const k1 = 1 - Math.exp(-dt / 0.269)
    const k2 = 1 - Math.exp(-dt / 0.408)
    const P = ptr.current
    P.x += (P.tx - P.x) * k1
    P.y += (P.ty - P.y) * k1
    P.act += (P.tact - P.act) * k2
    const act = reduced ? 0 : P.act

    const th = (cfg.angle * Math.PI) / 180
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const a = Math.abs(th)
    // rotated drawing region large enough to cover the buffer at the angle
    const DW = Math.ceil(W * Math.cos(a) + H * Math.sin(a)) + 8
    const DH = Math.ceil(W * Math.sin(a) + H * Math.cos(a)) + 8
    const sw = Math.ceil(DW / 2) + 320
    const sh = Math.ceil(DH / 2)
    const stripW = Math.max(14, cfg.ridgeWidth) * pxPerCss // same clamp as the pane

    // pointer mapped into the rotated drawing space (normalized)
    const dx = (P.x - 0.5) * W
    const dy = (P.y - 0.5) * H
    const rpx = (dx * cos + dy * sin + DW / 2) / DW
    const rpy = (-dx * sin + dy * cos + DH / 2) / DH

    // slow, organic accent drift around the design teal — hue leans between
    // green-teal and cyan while saturation/lightness breathe. Periods sit in
    // the 25–40s range so the color visibly lives with no cursor at all.
    const [ar, ag, ab] = hslToRgb(
      baseHsl[0] + 0.05 * Math.sin(ts * 0.16) + 0.02 * Math.sin(ts * 0.37 + 2.1),
      clamp01(baseHsl[1] + 0.07 * Math.sin(ts * 0.24 + 1.0)),
      clamp01(baseHsl[2] + 0.05 * Math.sin(ts * 0.19 + 0.5)),
    )
    u.uAccent.value.set(ar, ag, ab)
    u.uHaze.value = cfg.haze
    u.uGain.value = cfg.blobStrength

    // gradation blobs: drift + breathing + pointer parallax (scene units).
    // The lissajous travel (~7% of the scene, ~20s periods) is the visible
    // idle motion of the gradation.
    const ox = (rpx - 0.5) * sw * 0.1
    const oy = (rpy - 0.5) * sh * 0.08
    const cx =
      sw * 0.5 +
      ox +
      drift * (sw * 0.07 * Math.sin(ts * 0.31) + sw * 0.03 * Math.sin(ts * 0.53 + 1.3))
    const cy =
      sh * 0.48 +
      oy +
      drift * (sh * 0.08 * Math.cos(ts * 0.36) + sh * 0.035 * Math.sin(ts * 0.47 + 0.6))
    const br = 1 + 0.07 * drift * Math.sin(ts * 0.42) // slow breathing
    u.uBlobCA.value.set(
      cx,
      cy,
      cx + drift * sw * 0.035 * Math.sin(ts * 0.27 + 2), // deep core, counter-drift
      cy + drift * sh * 0.025 * Math.cos(ts * 0.33),
    )
    u.uBlobCB.value.set(
      cx - drift * sw * 0.018 * Math.sin(ts * 0.4), // faint bright center
      cy - drift * sh * 0.012 * Math.cos(ts * 0.29),
    )
    u.uBlobR.value.set(sw * 0.5 * br, sw * 0.3 * br, sw * 0.14 * br, sw * 0.045)

    // blades: column snap, cursor gaussians, breathing — CPU per frame,
    // like the original engine's drawMask
    const sigX = 2 * Math.pow(DW * 0.09, 2)
    const sigY = 2 * Math.pow(DH * 0.22, 2)
    const bladesA = u.uBladesA.value
    const alphas = u.uBladesAlpha.value
    for (let i = 0; i < NB; i++) {
      const b = BLADES[i]
      const x0 = Math.round((b.x * DW) / stripW) * stripW
      const bw = b.w * stripW
      const ex = x0 + bw / 2 - rpx * DW
      const ey = (b.y - rpy) * DH
      const g =
        Math.exp(-(ex * ex) / sigX) *
        Math.exp(-(ey * ey) / sigY) *
        act *
        cfg.cursorPower
      const breathe = 0.55 + 0.45 * Math.sin(ts * b.sp * 2.0 + b.ph)
      alphas[i] = Math.min(1, b.a * breathe * 1.25 * cfg.bladeStrength + 0.8 * g)
      const len = DH * b.len * 1.45 * (1 + 0.35 * g)
      bladesA[i].set(x0, bw, b.y * DH - len / 2, len)
    }

    u.uRes.value.set(W, H)
    u.uDraw.value.set(DW, DH)
    u.uScene.value.set(sw, sh)

    u.uCos.value = cos
    u.uSin.value = sin

    // the shaped-glass mask, in buffer pixels (y-down, like p in the shader)
    u.uShapeC.value.set(cfg.shapeX * W, cfg.shapeY * H)
    const ryB = cfg.shapeScale * H
    u.uShapeR.value.set(Math.min(ryB * cfg.shapeAspect, cfg.shapeMaxW * W), ryB)
    u.uShapeSoft.value = cfg.shapeSoft
    u.uShapeWobble.value = cfg.shapeWobble
    u.uBottomFeather.value = cfg.bottomFeather
    u.uContentScale.value = cfg.contentScale
    u.uPageFade.value = cfg.pageFade

    // render the background scene into the buffer the glass refracts
    state.gl.setRenderTarget(buffer)
    state.gl.render(bgScene, state.camera)
    state.gl.setRenderTarget(null)

    // cursor: subtle pane tilt + key-light sweep across the flutes
    const tilt = reduced ? 0 : cfg.cursorPower * 0.5
    if (tiltRef.current) {
      tiltRef.current.rotation.x = (P.y - 0.5) * -0.05 * tilt
      tiltRef.current.rotation.y = (P.x - 0.5) * 0.09 * tilt
    }
    if (lightRef.current) {
      lightRef.current.position.set(
        (P.x - 0.5) * (reduced ? 0 : 18),
        6 - (P.y - 0.5) * (reduced ? 0 : 8),
        14,
      )
    }
  })

  return (
    <>
      {createPortal(<BgQuad uniforms={uniforms} />, bgScene)}

      {/* the page around the glass: the same buffer, unrefracted — the
          shape mask keeps everything out there a clean page gradient, and
          the glass rim alpha-blends into it with no visible seam */}
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} toneMapped={false} />
      </mesh>

      {/* transmission replaces MTM's diffuse term entirely, so this light
          contributes specular only — the moving sheen on the flute crests */}
      <directionalLight
        ref={lightRef}
        position={[0, 6, 14]}
        intensity={cfg.lightIntensity}
      />

      {/* tilt pivots at the disc center, so the cursor rocks the glass in
          place instead of swinging it around the viewport */}
      <group ref={tiltRef} position={[shapeCX, shapeCY, GLASS_Z]}>
        <mesh geometry={geometry} rotation={[0, 0, rotZ]} frustumCulled={false}>
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            transmission={1}
            thickness={cfg.thickness}
            ior={cfg.ior}
            chromaticAberration={cfg.chromaticAberration}
            anisotropicBlur={cfg.anisotropicBlur}
            roughness={cfg.roughness}
            clearcoat={cfg.clearcoat}
            clearcoatRoughness={cfg.clearcoatRoughness}
            distortion={cfg.distortion}
            distortionScale={cfg.distortionScale}
            samples={Math.round(cfg.samples)}
            resolution={64} // shrinks MTM's unused internal FBOs (we pass `buffer`)
            envMapIntensity={cfg.envMapIntensity}
            color="#ffffff"
            // the rim melt: RGBA vertex colors fade the glass out over the
            // unrefracted backdrop (alpha 0 strictly inside the mesh bounds)
            vertexColors
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tune panel — live-edit every HeroConfig knob, copy the JSON to pin it.
// ---------------------------------------------------------------------------

type TuneNumberKey = {
  [K in keyof HeroConfig]: HeroConfig[K] extends number ? K : never
}[keyof HeroConfig]

interface TuneSpec {
  key: TuneNumberKey
  label: string
  min: number
  max: number
  step: number
}

const TUNE_GROUPS: Array<{
  title: string
  open?: boolean
  items: Array<TuneSpec>
}> = [
  {
    title: 'glass',
    open: true,
    items: [
      { key: 'thickness', label: 'thickness', min: 0, max: 3, step: 0.01 },
      { key: 'ior', label: 'ior', min: 1, max: 2, step: 0.01 },
      { key: 'chromaticAberration', label: 'chroma ab', min: 0, max: 0.4, step: 0.005 },
      { key: 'anisotropicBlur', label: 'frost blur', min: 0, max: 1.5, step: 0.01 },
      { key: 'roughness', label: 'roughness', min: 0, max: 0.6, step: 0.005 },
      { key: 'clearcoat', label: 'clearcoat', min: 0, max: 1, step: 0.01 },
      { key: 'clearcoatRoughness', label: 'coat rough', min: 0, max: 1, step: 0.01 },
      { key: 'samples', label: 'samples', min: 4, max: 32, step: 1 },
      { key: 'distortion', label: 'distortion', min: 0, max: 1, step: 0.01 },
      { key: 'distortionScale', label: 'dist scale', min: 0.1, max: 2, step: 0.05 },
    ],
  },
  {
    title: 'flutes',
    items: [
      { key: 'ridgeWidth', label: 'flute px', min: 14, max: 120, step: 1 },
      { key: 'angle', label: 'angle deg', min: -45, max: 45, step: 1 },
      { key: 'depth', label: 'depth', min: 0.1, max: 0.9, step: 0.01 },
      { key: 'seamCurve', label: 'seam curve', min: 0.5, max: 3, step: 0.05 },
    ],
  },
  {
    title: 'shape',
    open: true,
    items: [
      { key: 'shapeX', label: 'center x', min: 0, max: 1, step: 0.005 },
      { key: 'shapeY', label: 'center y', min: 0, max: 1, step: 0.005 },
      { key: 'shapeScale', label: 'size', min: 0.15, max: 0.9, step: 0.005 },
      { key: 'shapeAspect', label: 'aspect', min: 0.5, max: 2.5, step: 0.01 },
      { key: 'shapeMaxW', label: 'max width', min: 0.3, max: 1.2, step: 0.01 },
      { key: 'shapeSoft', label: 'rim soft', min: 0.05, max: 0.9, step: 0.01 },
      { key: 'shapeWobble', label: 'wobble', min: 0, max: 0.35, step: 0.005 },
      { key: 'bottomFeather', label: 'bottom fade', min: 0, max: 1.5, step: 0.01 },
      { key: 'contentScale', label: 'bars mask', min: 0.4, max: 1.5, step: 0.01 },
    ],
  },
  {
    title: 'light + env',
    items: [
      { key: 'envMapIntensity', label: 'reflections', min: 0, max: 3, step: 0.05 },
      { key: 'envLevel', label: 'strip level', min: 0, max: 2.5, step: 0.05 },
      { key: 'envBlur', label: 'strip blur', min: 0, max: 0.6, step: 0.01 },
      { key: 'lightIntensity', label: 'key light', min: 0, max: 3, step: 0.05 },
    ],
  },
  {
    title: 'background',
    items: [
      { key: 'blobStrength', label: 'gradation', min: 0, max: 2, step: 0.05 },
      { key: 'haze', label: 'haze', min: 0, max: 0.8, step: 0.01 },
      { key: 'bladeStrength', label: 'blades', min: 0, max: 2, step: 0.05 },
      { key: 'pageFade', label: 'page fade', min: 0, max: 0.7, step: 0.01 },
    ],
  },
  {
    title: 'motion',
    items: [
      { key: 'idleSpeed', label: 'idle speed', min: 0, max: 4, step: 0.05 },
      { key: 'idleDrift', label: 'idle drift', min: 0, max: 3, step: 0.05 },
      { key: 'cursorPower', label: 'cursor', min: 0, max: 3, step: 0.05 },
    ],
  },
]

function fmt(v: number, step: number) {
  const d = step >= 1 ? 0 : Math.min(3, (String(step).split('.')[1] ?? '').length)
  return v.toFixed(d)
}

const TS: Record<string, CSSProperties> = {
  fab: {
    position: 'fixed',
    right: 12,
    bottom: 12,
    zIndex: 2147483000,
    padding: '7px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(17,20,26,0.88)',
    color: '#e8ecf3',
    font: '12px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
    cursor: 'pointer',
  },
  box: {
    position: 'fixed',
    right: 12,
    top: 12,
    zIndex: 2147483000,
    width: 292,
    maxHeight: 'calc(100vh - 24px)',
    overflowY: 'auto',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(17,20,26,0.92)',
    color: '#e8ecf3',
    font: '11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace',
    padding: '10px 12px 12px',
    backdropFilter: 'blur(8px)',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  btn: {
    marginLeft: 6,
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#e8ecf3',
    font: 'inherit',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '1px 0',
  },
  lbl: { width: 84, flexShrink: 0, opacity: 0.75 },
  range: { flex: 1, minWidth: 0, accentColor: '#0F9D8C' },
  val: { width: 52, flexShrink: 0, textAlign: 'right', opacity: 0.9 },
  summary: {
    cursor: 'pointer',
    userSelect: 'none',
    opacity: 0.9,
    letterSpacing: '0.04em',
    padding: '4px 0 2px',
  },
  hint: { marginTop: 8, opacity: 0.55 },
}

interface TunePanelProps {
  cfg: HeroConfig
  onChange: (next: HeroConfig) => void
  onReset: () => void
}

function TunePanel({ cfg, onChange, onReset }: TunePanelProps) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = () => {
    const json = JSON.stringify(cfg, null, 2)
    console.info('[hero-glass config]\n' + json)
    navigator.clipboard
      ?.writeText(json)
      .then(() => {
        setCopied(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1200)
      })
      .catch(() => {})
  }

  return createDomPortal(
    open ? (
      <div style={TS.box}>
        <div style={TS.head}>
          <strong>glass tune</strong>
          <span>
            <button type="button" style={TS.btn} onClick={copy}>
              {copied ? 'copied ✓' : 'copy json'}
            </button>
            <button type="button" style={TS.btn} onClick={onReset}>
              reset
            </button>
            <button type="button" style={TS.btn} onClick={() => setOpen(false)}>
              ×
            </button>
          </span>
        </div>
        {TUNE_GROUPS.map((g) => (
          <details key={g.title} open={g.open}>
            <summary style={TS.summary}>{g.title}</summary>
            {g.title === 'background' && (
              <div style={TS.row}>
                <span style={TS.lbl}>accent</span>
                <input
                  type="color"
                  value={cfg.accentColor}
                  onChange={(e) => onChange({ ...cfg, accentColor: e.target.value })}
                  style={{ flex: 1, minWidth: 0, height: 22 }}
                />
                <span style={TS.val}>{cfg.accentColor}</span>
              </div>
            )}
            {g.items.map((spec) => (
              <div key={spec.key} style={TS.row}>
                <span style={TS.lbl}>{spec.label}</span>
                <input
                  type="range"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={cfg[spec.key]}
                  onChange={(e) =>
                    onChange({ ...cfg, [spec.key]: Number(e.target.value) })
                  }
                  style={TS.range}
                />
                <span style={TS.val}>{fmt(cfg[spec.key], spec.step)}</span>
              </div>
            ))}
          </details>
        ))}
        <div style={TS.hint}>
          copy json → paste into `glassConfig` on HeroCanvas to pin this look
        </div>
      </div>
    ) : (
      <button type="button" style={TS.fab} onClick={() => setOpen(true)}>
        ⚙ glass tune
      </button>
    ),
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export default function HeroScene({
  accentColor = '#0F9D8C',
  angle = -10,
  ridgeWidth = 82,
  refraction = 1,
  cursorPower = 2,
  glassConfig,
}: HeroSceneProps) {
  const [ready, setReady] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [visible, setVisible] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RootState | null>(null)

  const defaults = useMemo<HeroConfig>(
    () => ({
      ...makeDefaults(accentColor, angle, ridgeWidth, refraction, cursorPower),
      ...glassConfig,
    }),
    [accentColor, angle, ridgeWidth, refraction, cursorPower, glassConfig],
  )
  const [cfg, setCfg] = useState<HeroConfig>(defaults)
  // tune panel: dev only — never shipped in production builds
  const tune = import.meta.env.DEV

  // frameloop is driven declaratively through the Canvas prop — R3F's
  // configure() re-asserts the prop on every commit, so an imperative
  // setFrameloop() override would be stomped by any re-render. 'demand'
  // (not 'never') is the paused mode: invalidate() is a no-op under
  // 'never', and the static frame must still be able to render.
  const frameloop = reduced || !visible ? 'demand' : 'always'

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  // pause the loop entirely while the hero is scrolled out of view
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1]
      setVisible(last ? last.isIntersecting : true)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ready])

  // paused mode never repaints on its own — render one fresh static frame
  // on entry (and on resize) so the hero never sits stale or blank
  useEffect(() => {
    if (!ready || frameloop !== 'demand') return
    stateRef.current?.invalidate()
    const onResize = () => stateRef.current?.invalidate()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [ready, frameloop])

  return (
    <>
      <Canvas
        ref={canvasRef}
        // capped at 1.5: the full-viewport transmission pass is fill-bound and
        // the frosted-glass look doesn't reward retina-exact sampling
        dpr={[1, 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 0, CAM_Z], fov: 15 }}
        // raw design-space colors end to end: no tone mapping, no sRGB re-encode
        linear
        flat
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        onCreated={(state) => {
          stateRef.current = state
          state.gl.setClearColor('#f5f6f9', 1)
          setReady(true)
        }}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: ready ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}
      >
        <Scene cfg={cfg} reduced={reduced} />
      </Canvas>
      {tune && (
        <TunePanel cfg={cfg} onChange={setCfg} onReset={() => setCfg(defaults)} />
      )}
    </>
  )
}
