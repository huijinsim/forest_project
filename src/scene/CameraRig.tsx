import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { smoothPointer } from '../store/pointer'

/**
 * CameraRig — runs every frame via useFrame.
 *  • Smooths the raw R3F pointer into smoothPointer (shared by all layers)
 *  • Adds a gentle idle breathing motion so the scene feels alive even
 *    when the mouse is still
 *  • Applies a very subtle camera tilt that reinforces depth without
 *    feeling like a game camera
 */
export default function CameraRig() {
  const elapsed = useRef(0)
  const lookAt = useRef(new THREE.Vector3(0, 1.15, -4.8))

  useFrame(({ camera, pointer }, dt) => {
    elapsed.current += dt

    // ── Smooth the pointer ─────────────────────────────────────────────────
    // Damped pointer input, used like the reference bundle's mouse-driven
    // scene graph updates: camera moves, not just a flat texture.
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.07
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.07

    const t = elapsed.current

    const targetX = smoothPointer.x * 0.72 + Math.sin(t * 0.18) * 0.12
    const targetY = 1.55 + smoothPointer.y * 0.22 + Math.sin(t * 0.31) * 0.04
    const targetZ = 5.7 + smoothPointer.y * 0.18

    camera.position.x += (targetX - camera.position.x) * 0.055
    camera.position.y += (targetY - camera.position.y) * 0.055
    camera.position.z += (targetZ - camera.position.z) * 0.055

    lookAt.current.set(smoothPointer.x * 0.45, 1.05 + smoothPointer.y * 0.16, -4.9)
    camera.lookAt(lookAt.current)
  })

  return null
}
