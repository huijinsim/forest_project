import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying float vViewDist;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 viewPos = viewMatrix * worldPos;
    vViewDist = -viewPos.z;
    gl_Position = projectionMatrix * viewPos;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uInk;
  uniform vec3 uLightDir;
  uniform float uHatch;
  uniform float uTime;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying float vViewDist;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 n = normalize(vNormalW);

    // FLAT illustration shading: a smooth top→bottom gradient driven by the
    // world-up component, NOT a per-face light dot. Adjacent facets share a
    // similar up value, so the low-poly facets stop reading as 3D shapes and
    // the canopy looks like a flat-filled drawing with a soft highlight.
    float up = n.y * 0.5 + 0.5;
    float lit = dot(n, normalize(uLightDir)) * 0.5 + 0.5;
    float shade = mix(0.80, 1.10, smoothstep(0.15, 0.95, up * 0.7 + lit * 0.3));

    vec3 col = uBase * shade;

    // fine, mostly-parallel pen strokes (not a regular grid) confined to the
    // shaded underside — reads as hand-inked hatching rather than a texture
    float stroke = sin((vWorldPos.x * 26.0 + vWorldPos.y * 31.0));
    float jitter = sin(vWorldPos.y * 90.0 + vWorldPos.z * 60.0) * 0.12;
    float h1 = smoothstep(0.74, 0.99, stroke + jitter);
    float shadeMask = smoothstep(0.55, 0.05, up);
    col = mix(col, uInk, h1 * shadeMask * uHatch * 0.5);

    float grain = hash(vWorldPos.xz * 42.0 + vWorldPos.yy * 3.0);
    col += (grain - 0.5) * 0.018;

    // aerial haze — far geometry fades toward the sky/fog colour
    float fogT = smoothstep(uFogNear, uFogFar, vViewDist);
    col = mix(col, uFog, fogT * 0.85);

    gl_FragColor = vec4(col, 1.0);
  }
`

interface InkMaterialProps {
  color: string
  ink?: string
  hatch?: number
}

export default function InkMaterial({
  color,
  ink = '#172015',
  hatch = 0.45,
}: InkMaterialProps) {
  const ref = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color(color) },
      uInk: { value: new THREE.Color(ink) },
      uLightDir: { value: new THREE.Vector3(-0.35, 0.75, 0.55).normalize() },
      uHatch: { value: hatch },
      uTime: { value: 0 },
      uFog: { value: new THREE.Color('#bcd08a') },
      uFogNear: { value: 8.5 },
      uFogFar: { value: 16.0 },
    }),
    [color, hatch, ink],
  )

  useFrame((_, dt) => {
    if (ref.current) ref.current.uniforms.uTime.value += dt
  })

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      side={THREE.FrontSide}
    />
  )
}
