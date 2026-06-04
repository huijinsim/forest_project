import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FOREST_VERT, FOREST_FRAG } from '../shaders/forestScene'
import { smoothPointer } from '../store/pointer'

export default function ForestShader() {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const { size } = useThree()

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    [],
  )

  // Single fullscreen triangle (no internal quad diagonal → no derivative seam)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    )
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2))
    return g
  }, [])

  useFrame(({ pointer }, dt) => {
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.06
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.06
    const u = matRef.current.uniforms
    u.uTime.value += dt
    u.uMouse.value.set(smoothPointer.x, smoothPointer.y)
    u.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={FOREST_VERT}
        fragmentShader={FOREST_FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
