import { useRef, useMemo } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import LAYER_VERT from '../../shaders/layer.vert'
import LAYER_FRAG from '../../shaders/layer.frag'
import { smoothPointer } from '../../store/pointer'
import { layerScale, CAM_FOV, FOG_COLOR, type LayerConfig } from '../../data/layers.config'

type Props = Omit<LayerConfig, 'label'>

// ─────────────────────────────────────────────────────────────────────────────
// Shared mesh renderer. Receives an already-resolved texture (or null) so the
// uniforms are correct from the very first frame — no async race, no StrictMode
// orphaned-uniform problem.
// ─────────────────────────────────────────────────────────────────────────────
function LayerMesh({
  id,
  z,
  parallaxFactor,
  wind,
  fogAmount,
  color,
  band,
  bandFeather = 0.1,
  texture,
}: Props & { texture: THREE.Texture | null }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const { size } = useThree()

  const aspect = size.width / size.height
  const bleed = 1.35 + parallaxFactor * 0.18
  const [w, h] = layerScale(z, CAM_FOV, aspect, bleed)
  const segments: number = wind > 0 ? 22 : 1

  // Placeholder (no texture): fade the solid colour out toward the top so
  // back layers / sky remain visible.
  const fadeY = Math.max(0.35, 0.7 - parallaxFactor * 0.2)

  const imgAspect =
    texture && (texture.image as { width: number; height: number })
      ? (texture.image as { width: number; height: number }).width /
        (texture.image as { width: number; height: number }).height
      : 0

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uHasMap: { value: texture ? 1 : 0 },
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uWind: { value: wind },
      uFogAmount: { value: fogAmount },
      uFogColor: { value: new THREE.Color(FOG_COLOR) },
      uFadeY: { value: fadeY },
      uImgAspect: { value: imgAspect },
      uPlaneAspect: { value: w / h },
      // Bias cover-crop upward for portrait images so the sky/sun stays in view
      uCropBias: { value: 0 },
      // Depth band (screen-space). uBandMax >= 1.5 → full frame (disabled).
      uBandMin: { value: band ? band[0] : 0 },
      uBandMax: { value: band ? band[1] : 2 },
      uBandFeather: { value: bandFeather },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Keep aspect-dependent uniforms fresh on viewport resize
  uniforms.uPlaneAspect.value = w / h
  uniforms.uCropBias.value =
    imgAspect > 0 && imgAspect < w / h ? 0.06 : 0

  useFrame((_, dt) => {
    if (!meshRef.current) return
    const px = -smoothPointer.x * parallaxFactor
    const py = -smoothPointer.y * parallaxFactor * 0.55
    meshRef.current.position.x += (px - meshRef.current.position.x) * 0.072
    meshRef.current.position.y += (py - meshRef.current.position.y) * 0.072
    matRef.current.uniforms.uTime.value += dt
  })

  return (
    <mesh
      ref={meshRef}
      // Closer layers (smaller |z|) draw last so they sit on top.
      renderOrder={200 - Math.round(Math.abs(z) * 10)}
      position={[0, 0, z]}
    >
      <planeGeometry args={[w, h, segments, segments]} />
      <shaderMaterial
        ref={matRef}
        key={id}
        vertexShader={LAYER_VERT}
        fragmentShader={LAYER_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

// Textured variant — suspends until the PNG is decoded, then hands a ready
// texture to LayerMesh.
function TexturedLayer({ src, ...rest }: Props & { src: string }) {
  const texture = useLoader(THREE.TextureLoader, src)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return <LayerMesh {...rest} src={src} texture={texture} />
}

export default function ParallaxLayer(props: Props) {
  if (props.src) return <TexturedLayer {...(props as Props & { src: string })} />
  return <LayerMesh {...props} texture={null} />
}
