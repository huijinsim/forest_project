import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import InkMaterial from './materials/InkMaterial'
import OutlineMaterial from './materials/OutlineMaterial'
import { makeFoliage, makeConifer } from './geometry/foliage'

interface TreeData {
  id: number
  x: number
  z: number
  scale: number
  type: 'pine' | 'round'
  color: string
  variant: number
}

const CANOPY_COLORS = ['#7d9152', '#6f854b', '#5d7440', '#8a9a63', '#9aac6b', '#52733f']
const TRUNK_LIGHT = '#9c9180'
const TRUNK_DARK = '#6f6553'

function seeded(index: number) {
  const x = Math.sin(index * 91.345) * 10000
  return x - Math.floor(x)
}

// ── Ink primitive: shared organic geometry, flat toon fill + pen outline ─────
function InkMesh({
  geo,
  color,
  hatch = 0.45,
  outline = 0.03,
  ink = '#16200f',
  wobble = 0.5,
  position,
  rotation,
  scale,
}: {
  geo: THREE.BufferGeometry
  color: string
  hatch?: number
  outline?: number
  ink?: string
  wobble?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} renderOrder={2}>
        <InkMaterial color={color} hatch={hatch} ink={ink} />
      </mesh>
      <mesh geometry={geo} renderOrder={1}>
        <OutlineMaterial thickness={outline} ink={ink} wobble={wobble} />
      </mesh>
    </group>
  )
}

function Tree({
  data,
  foliage,
  conifers,
}: {
  data: TreeData
  foliage: THREE.BufferGeometry[]
  conifers: THREE.BufferGeometry[]
}) {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const amp = 0.018 + data.scale * 0.005
    group.current.rotation.z = Math.sin(t * 0.65 + data.id * 0.73) * amp
  })

  const trunkColor = seeded(data.id + 3) > 0.5 ? TRUNK_LIGHT : TRUNK_DARK
  const ol = 0.05 / data.scale

  if (data.type === 'pine') {
    const trunkH = 0.4 * data.scale
    return (
      <group ref={group} position={[data.x, 0, data.z]} scale={data.scale}>
        <InkMesh
          position={[0, trunkH * 0.5, 0]}
          geo={trunkGeo}
          color={trunkColor}
          hatch={0.3}
          outline={ol}
          scale={[0.6, trunkH / 1.0, 0.6]}
        />
        <InkMesh
          position={[0, trunkH + 0.62, 0]}
          rotation={[0, data.id, 0]}
          geo={conifers[data.variant % conifers.length]}
          color={data.color}
          hatch={0.55}
          outline={ol}
        />
        <InkMesh
          position={[0, trunkH + 0.18, 0]}
          rotation={[0, data.id * 1.7, 0]}
          geo={conifers[(data.variant + 1) % conifers.length]}
          color={data.color}
          hatch={0.5}
          outline={ol}
          scale={1.15}
        />
      </group>
    )
  }

  const trunkH = 0.62 * data.scale
  return (
    <group ref={group} position={[data.x, 0, data.z]} scale={data.scale}>
      <InkMesh
        position={[0, trunkH * 0.5, 0]}
        geo={trunkGeo}
        color={trunkColor}
        hatch={0.3}
        outline={ol}
        scale={[0.55, trunkH / 1.0, 0.55]}
      />
      <InkMesh
        position={[0, trunkH + 0.42, 0]}
        rotation={[0, data.id, 0]}
        geo={foliage[data.variant % foliage.length]}
        color={data.color}
        hatch={0.55}
        outline={ol}
      />
      <InkMesh
        position={[0.16, trunkH + 0.2, 0.05]}
        rotation={[0, data.id * 2.1, 0]}
        geo={foliage[(data.variant + 2) % foliage.length]}
        color={data.color}
        hatch={0.5}
        outline={ol}
        scale={0.72}
      />
    </group>
  )
}

// Shared simple tapered-trunk geometry (module scope → built once)
const trunkGeo = new THREE.CylinderGeometry(0.07, 0.12, 1.0, 7)

function Mountain({
  position,
  scale,
  color,
  geo,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  color: string
  geo: THREE.BufferGeometry
}) {
  return (
    <group position={position} scale={scale}>
      <InkMesh geo={geo} color={color} hatch={0.2} outline={0.012} ink="#3a4230" wobble={0.3} />
    </group>
  )
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const geo = useMemo(() => makeFoliage(0.7, 2, position[0] * 3.1, 0.55, 0.3, 1.8), [position])
  return (
    <InkMesh
      geo={geo}
      color="#f4efd9"
      hatch={0}
      outline={0.02}
      ink="#7c7560"
      wobble={0.6}
      position={position}
      scale={scale}
    />
  )
}

function SkyDome() {
  return (
    <mesh position={[0, 4.7, -13]} scale={[34, 13, 1]} renderOrder={-10}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        depthWrite={false}
        depthTest={false}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vec3 top = vec3(0.74, 0.82, 0.55);
            vec3 horizon = vec3(0.97, 0.84, 0.46);
            vec3 col = mix(horizon, top, smoothstep(0.0, 1.0, vUv.y));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -2]}>
      <planeGeometry args={[30, 22, 1, 1]} />
      <InkMaterial color="#9fae62" hatch={0.14} />
    </mesh>
  )
}

function Bush({
  position,
  scale,
  color,
  geo,
}: {
  position: [number, number, number]
  scale: number
  color: string
  geo: THREE.BufferGeometry
}) {
  return (
    <InkMesh
      geo={geo}
      color={color}
      hatch={0.5}
      outline={0.018 / scale}
      position={position}
      scale={[scale, scale * 0.8, scale]}
    />
  )
}

export default function ForestWorld() {
  const foliage = useMemo(
    () => Array.from({ length: 6 }, (_, i) => makeFoliage(0.55, 4, i * 3.3, 1.1 + (i % 3) * 0.08, 0.4)),
    [],
  )
  const conifers = useMemo(
    () => Array.from({ length: 4 }, (_, i) => makeConifer(0.5, 1.5, i * 2.1, 0.5)),
    [],
  )
  const bushGeos = useMemo(
    () => Array.from({ length: 4 }, (_, i) => makeFoliage(0.5, 2, 50 + i * 4.2, 0.85, 0.5, 2.6)),
    [],
  )
  const mountainGeo = useMemo(() => makeConifer(1.0, 1.4, 12, 0.05), [])

  const trees = useMemo<TreeData[]>(() => {
    return Array.from({ length: 70 }, (_, i) => {
      const row = Math.floor(i / 12)
      const col = i % 12
      const z = -7.0 + row * 1.12 + seeded(i + 10) * 0.6
      const spread = 8.6 - row * 0.4
      const x = (col / 11 - 0.5) * spread + (seeded(i + 20) - 0.5) * 0.85
      const near = THREE.MathUtils.clamp((z + 7.0) / 6.5, 0, 1)
      const type: TreeData['type'] = seeded(i + 40) > 0.5 ? 'pine' : 'round'
      return {
        id: i,
        x,
        z,
        scale: 0.5 + near * 0.85 + seeded(i + 30) * 0.3,
        type,
        color: CANOPY_COLORS[Math.floor(seeded(i + 50) * CANOPY_COLORS.length)],
        variant: Math.floor(seeded(i + 60) * 6),
      }
    }).sort((a, b) => a.z - b.z)
  }, [])

  const bushes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: (seeded(i + 200) - 0.5) * 11,
        z: -1.0 + seeded(i + 210) * 2.6,
        scale: 0.5 + seeded(i + 220) * 0.6,
        color: CANOPY_COLORS[Math.floor(seeded(i + 230) * CANOPY_COLORS.length)],
        geo: i % 4,
      })),
    [],
  )

  return (
    <group>
      <SkyDome />

      <ambientLight intensity={1.4} />
      <directionalLight position={[-4, 6, 5]} intensity={1.25} color="#fff3d2" />
      <directionalLight position={[5, 3, -2]} intensity={0.35} color="#c2d68f" />

      <Cloud position={[-3.5, 4.2, -11]} scale={1.6} />
      <Cloud position={[0.5, 4.7, -11.5]} scale={2.1} />
      <Cloud position={[4.2, 4.1, -11]} scale={1.5} />

      <Ground />

      <Mountain position={[-3.7, 1.1, -9.6]} scale={[2.4, 2.55, 1.0]} color="#aab089" geo={mountainGeo} />
      <Mountain position={[1.7, 1.5, -10.1]} scale={[3.6, 3.2, 1.1]} color="#9ea486" geo={mountainGeo} />
      <Mountain position={[5.2, 1.0, -9.4]} scale={[2.0, 2.3, 0.9]} color="#b0b48d" geo={mountainGeo} />

      {trees.map((tree) => (
        <Tree key={tree.id} data={tree} foliage={foliage} conifers={conifers} />
      ))}

      {bushes.map((b) => (
        <Bush
          key={`bush-${b.id}`}
          position={[b.x, 0.12 * b.scale, b.z]}
          scale={b.scale}
          color={b.color}
          geo={bushGeos[b.geo]}
        />
      ))}
    </group>
  )
}
