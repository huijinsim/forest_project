// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for every 2.5D layer.
//
// parallaxFactor : how many world-units the layer shifts per unit of pointer.
//                  0 = fixed (sky), 1.8 = strongest (foreground grass)
// wind           : vertex-displacement strength. 0 = still, 1 = heavy sway
// fogAmount      : 0 = crisp, 1 = fully merged with fog colour (aerial haze)
// color          : placeholder colour used until a real PNG is available.
// src            : optional PNG path.  Drop the file in /public/textures/layers/
//                  and set this to '/textures/layers/xxx.png' to activate.
// ─────────────────────────────────────────────────────────────────────────────

export interface LayerConfig {
  id: string
  label: string
  src?: string
  z: number
  parallaxFactor: number
  wind: number
  fogAmount: number
  color: string
  // Optional depth band (screen-space vUv.y, 0 = bottom .. 1 = top).
  // Lets several layers share ONE composite illustration but live at
  // different depths → real parallax. Omit for a full-frame layer.
  band?: [number, number]
  bandFeather?: number
}

export const FOG_COLOR = '#d9dfca'

// Camera lives at z = 0 looking toward negative-z; layers are at negative z.
// Plane size is computed from depth so each layer perfectly fills the viewport.
export const CAM_FOV = 42       // narrow → illustration-style compression
export const CAM_Z   = 0        // camera world position z

/**
 * Returns [width, height] in world units for a plane at `z` that fills the
 * viewport plus an overbleed margin (so parallax never reveals the edge).
 */
export function layerScale(
  z: number,
  fovDeg: number,
  aspect: number,
  overbleed = 1.35,
): [number, number] {
  const dist = Math.abs(CAM_Z - z)
  const h = 2 * dist * Math.tan((fovDeg * Math.PI) / 360) * overbleed
  return [h * aspect, h]
}

// ── Layer manifest ───────────────────────────────────────────────────────────
// Ordered back → front.  Add src: '/textures/layers/<id>.png' when PNG ready.
//
// We have one COMPOSITE illustration (sky + mountains + forest in one PNG).
// To get a genuine three.js-style sense of SPACE from a single image, the
// same texture is drawn on three planes at different depths, each masked to a
// horizontal screen band (sky / mountains / forest). At rest the bands line up
// seamlessly; as the camera moves, nearer bands shift more → real parallax.
//
// Bands overlap (feathered) so no gap appears at the seams during motion.
const FOREST_SRC = '/textures/layers/forest_full.png'

export const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'band_sky',
    label: 'Sky band',
    src: FOREST_SRC,
    z: -11.0,
    parallaxFactor: 0.05,
    wind: 0,
    fogAmount: 0.0,
    color: '#9cc06a',
    band: [0.62, 1.01],
    bandFeather: 0.1,
  },
  {
    id: 'band_mountains',
    label: 'Mountain band',
    src: FOREST_SRC,
    z: -5.5,
    parallaxFactor: 0.18,
    wind: 0,
    fogAmount: 0.0,
    color: '#8d8b6e',
    band: [0.3, 0.78],
    bandFeather: 0.1,
  },
  {
    id: 'band_forest',
    label: 'Forest band',
    src: FOREST_SRC,
    z: -2.2,
    parallaxFactor: 0.5,
    wind: 0.22,
    fogAmount: 0.0,
    color: '#5d7440',
    band: [-0.01, 0.44],
    bandFeather: 0.1,
  },
]
