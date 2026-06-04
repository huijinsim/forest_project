import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import SKY_FRAG, { SKY_VERT } from '../../shaders/sky.frag'
import { layerScale, CAM_FOV } from '../../data/layers.config'

const SKY_Z = -14
const SKY_TOP     = new THREE.Color('#e8cf83')
const SKY_HORIZON = new THREE.Color('#f3e8c4')

export default function Sky() {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const { size } = useThree()
  const aspect = size.width / size.height

  const [w, h] = layerScale(SKY_Z, CAM_FOV, aspect, 1.5)

  const uniforms = useMemo(
    () => ({
      uTop:     { value: SKY_TOP.clone() },
      uHorizon: { value: SKY_HORIZON.clone() },
      uTime:    { value: 0 },
    }),
    [],
  )

  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })

  return (
    <mesh position={[0, 0, SKY_Z]} renderOrder={0}>
      <planeGeometry args={[w, h]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
