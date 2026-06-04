import * as THREE from 'three'

// ── Tiny deterministic value noise (so geometry is stable across reloads) ────
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
function smooth(t: number) {
  return t * t * (3 - 2 * t)
}
function valueNoise(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = smooth(xf)
  const v = smooth(yf)
  const w = smooth(zf)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const c000 = hash3(xi, yi, zi)
  const c100 = hash3(xi + 1, yi, zi)
  const c010 = hash3(xi, yi + 1, zi)
  const c110 = hash3(xi + 1, yi + 1, zi)
  const c001 = hash3(xi, yi, zi + 1)
  const c101 = hash3(xi + 1, yi, zi + 1)
  const c011 = hash3(xi, yi + 1, zi + 1)
  const c111 = hash3(xi + 1, yi + 1, zi + 1)
  const x00 = lerp(c000, c100, u)
  const x10 = lerp(c010, c110, u)
  const x01 = lerp(c001, c101, u)
  const x11 = lerp(c011, c111, u)
  const y0 = lerp(x00, x10, v)
  const y1 = lerp(x01, x11, v)
  return lerp(y0, y1, w)
}
function fbm(x: number, y: number, z: number) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    v += a * valueNoise(x * f, y * f, z * f)
    f *= 2.0
    a *= 0.5
  }
  return v
}

/**
 * Lumpy, organic blob — a noise-displaced icosphere. The bumpy silhouette
 * reads as a hand-drawn leafy canopy once the ink outline traces it, instead
 * of a clean geometric sphere.
 */
export function makeFoliage(
  radius: number,
  detail: number,
  seed: number,
  squashY = 1.05,
  lumps = 0.42,
  freq = 2.4,
) {
  const geo = new THREE.IcosahedronGeometry(radius, detail)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    const big = fbm(n.x * freq + seed, n.y * freq + seed * 1.7, n.z * freq + seed * 2.3)
    // higher-frequency lobes create the little leafy scallops on the edge
    const fine = fbm(n.x * freq * 4.5 + seed, n.y * freq * 4.5, n.z * freq * 4.5 + seed)
    const disp = 1 + (big - 0.5) * lumps * 2 + (fine - 0.5) * lumps * 1.1
    v.multiplyScalar(disp)
    v.y *= squashY
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

/** Lumpy conifer — a noise-displaced cone for fir/pine silhouettes. */
export function makeConifer(
  radius: number,
  height: number,
  seed: number,
  lumps = 0.34,
) {
  const geo = new THREE.ConeGeometry(radius, height, 20, 14)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const ny = (v.y + height / 2) / height
    // ruffle the outline strongly toward the bottom for a feathery fir edge
    const ripple = fbm(v.x * 7 + seed, v.y * 9, v.z * 7 + seed)
    const fine = fbm(v.x * 18 + seed, v.y * 22, v.z * 18 + seed)
    const out = 1 + ((ripple - 0.5) * 1.5 + (fine - 0.5) * 0.9) * lumps * (1.0 - ny * 0.35)
    v.x *= out
    v.z *= out
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}
