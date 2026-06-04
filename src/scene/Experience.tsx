import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import SceneController from './SceneController'

export default function Experience() {
  return (
    <Canvas
      // Camera is irrelevant — the scene is drawn by a fullscreen shader.
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.NoToneMapping
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneController />
      </Suspense>
    </Canvas>
  )
}
