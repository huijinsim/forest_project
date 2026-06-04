import { useMemo } from 'react'
import * as THREE from 'three'

// Inverted-hull ink outline — the same idea as the reference bundle's
// dedicated "outline" material: render back-faces, pushed out along the
// vertex normal, in flat ink. Gives a clean, consistent pen line on every
// silhouette without any depth-buffer post-processing.
const VERT = /* glsl */ `
  uniform float uThickness;
  uniform float uWobble;

  float h31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main() {
    // vary the extrusion a little along the surface so the ink line has a
    // living, hand-drawn thickness instead of a mechanical constant width
    float n = h31(floor(position * 9.0));
    float t = uThickness * (1.0 - uWobble + uWobble * (0.4 + 1.2 * n));
    vec3 pos = position + normal * t;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uInk;
  void main() {
    gl_FragColor = vec4(uInk, 1.0);
  }
`

interface OutlineMaterialProps {
  thickness?: number
  ink?: string
  wobble?: number
}

export default function OutlineMaterial({
  thickness = 0.04,
  ink = '#10160d',
  wobble = 0.45,
}: OutlineMaterialProps) {
  const uniforms = useMemo(
    () => ({
      uThickness: { value: thickness },
      uInk: { value: new THREE.Color(ink) },
      uWobble: { value: wobble },
    }),
    [thickness, ink, wobble],
  )

  return (
    <shaderMaterial
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      side={THREE.BackSide}
    />
  )
}
