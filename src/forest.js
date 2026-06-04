import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

// ---------------------------------------------------------------------------
// A real 3D forest space (not a picture). Hundreds of low-poly trees populate
// a large volume that flows toward the camera so you feel like you are moving
// deep into the woods. Fog gives the space its depth; wind is a vertex shader;
// bloom + a custom atmosphere pass are the screen-space shader effects on top.
// The reference illustration is used only as a colour / mood guide.
// ---------------------------------------------------------------------------

const PALETTE = {
  skyTop: new THREE.Color('#efe2ac'),
  skyHorizon: new THREE.Color('#cdd8c0'),
  fog: new THREE.Color('#c6d4bb'),
  ground: new THREE.Color('#6d7c4c'),
  trunk: new THREE.Color('#6f5a44'),
  greens: ['#4f6b3a', '#5d7b42', '#425a33', '#6a8a4c', '#39512e'].map(
    (c) => new THREE.Color(c),
  ),
}

const TREE_COUNT = 520
const AREA_X = 46
const Z_NEAR = 14
const Z_FAR = -150
const FLOW_SPEED = 4.2

function setVertexColor(geo, color) {
  const n = geo.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = color.r
    arr[i * 3 + 1] = color.g
    arr[i * 3 + 2] = color.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return geo
}

// a stylised conifer: trunk + three stacked cones, merged into one geometry
function makeTreeGeometry(green) {
  const parts = []

  const trunk = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 6)
  trunk.translate(0, 0.7, 0)
  parts.push(setVertexColor(trunk, PALETTE.trunk))

  const cones = [
    { r: 1.15, h: 2.6, y: 2.0 },
    { r: 0.9, h: 2.1, y: 3.1 },
    { r: 0.58, h: 1.7, y: 4.15 },
  ]
  cones.forEach((c, i) => {
    const g = new THREE.ConeGeometry(c.r, c.h, 8)
    g.translate(0, c.y, 0)
    const shade = green.clone().offsetHSL(0, 0, i * 0.04)
    parts.push(setVertexColor(g, shade))
  })

  return mergeGeometries(parts, false)
}

function makeForest(scene, windUniforms) {
  // one instanced mesh per green variant keeps colour variety without per-tree
  // colour buffers fighting the merged vertex colours
  const groups = PALETTE.greens.map((green) => {
    const geo = makeTreeGeometry(green)
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniforms.uTime
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTime;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float sway = max(transformed.y - 1.0, 0.0);
           vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
           float phase = ip.x * 0.25 + ip.y * 0.35;
           transformed.x += sin(uTime * 1.2 + phase) * 0.05 * sway;
           transformed.z += cos(uTime * 0.9 + phase) * 0.035 * sway;`,
        )
    }
    const perGroup = Math.ceil(TREE_COUNT / PALETTE.greens.length)
    const mesh = new THREE.InstancedMesh(geo, mat, perGroup)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    scene.add(mesh)
    return { mesh, count: perGroup, data: [] }
  })

  // scatter trees across the volume
  const range = Z_NEAR - Z_FAR
  let placed = 0
  for (const group of groups) {
    for (let i = 0; i < group.count && placed < TREE_COUNT; i++, placed++) {
      group.data.push({
        x: (Math.random() * 2 - 1) * AREA_X,
        z: Z_FAR + Math.random() * range,
        rot: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 1.8,
      })
    }
  }

  const dummy = new THREE.Object3D()
  function update(flow) {
    for (const group of groups) {
      for (let i = 0; i < group.data.length; i++) {
        const t = group.data[i]
        // treadmill: wrap z so the forest endlessly streams toward the camera
        let z = Z_FAR + ((t.z - Z_FAR + flow) % range + range) % range
        dummy.position.set(t.x, 0, z)
        dummy.rotation.set(0, t.rot, 0)
        dummy.scale.setScalar(t.scale)
        dummy.updateMatrix()
        group.mesh.setMatrixAt(i, dummy.matrix)
      }
      group.mesh.instanceMatrix.needsUpdate = true
    }
  }

  return { update, range }
}

function makeGround() {
  const geo = new THREE.PlaneGeometry(400, 400, 80, 80)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const y = Math.sin(x * 0.06) * 0.6 + Math.cos(z * 0.05) * 0.6
    pos.setY(i, y)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshLambertMaterial({
    color: PALETTE.ground,
    flatShading: true,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = -0.4
  return mesh
}

function makeSky() {
  const geo = new THREE.SphereGeometry(320, 32, 16)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: PALETTE.skyTop },
      horizon: { value: PALETTE.skyHorizon },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top;
      uniform vec3 horizon;
      void main() {
        float h = clamp((normalize(vPos).y + 0.1) / 0.7, 0.0, 1.0);
        gl_FragColor = vec4(mix(horizon, top, h), 1.0);
      }
    `,
  })
  return new THREE.Mesh(geo, mat)
}

function makeSun() {
  const geo = new THREE.SphereGeometry(7, 24, 24)
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(34, 46, -120)
  return mesh
}

const AtmosphereShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float d = distance(vUv, vec2(0.5));
      c *= mix(1.0, 0.55, smoothstep(0.35, 0.95, d));         // vignette
      float g = fract(sin(dot(vUv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
      c += (g - 0.5) * 0.025;                                  // film grain
      c = pow(c, vec3(0.95));
      c *= vec3(1.04, 1.0, 0.93);                              // warm grade
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}

export function initForest(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(PALETTE.fog, 0.013)

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    400,
  )
  camera.position.set(0, 3.4, 14)

  // lighting: warm key light + soft sky/ground fill
  const hemi = new THREE.HemisphereLight(0xfff0c8, 0x4a5535, 0.95)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.15)
  sun.position.set(20, 30, -10)
  scene.add(sun)
  scene.add(new THREE.AmbientLight(0x4d5a3c, 0.4))

  scene.add(makeSky())
  scene.add(makeSun())
  scene.add(makeGround())

  const windUniforms = { uTime: { value: 0 } }
  const forest = makeForest(scene, windUniforms)

  // post-processing
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  composer.setSize(window.innerWidth, window.innerHeight)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55,
    0.7,
    0.72,
  )
  composer.addPass(bloom)
  const atmosphere = new ShaderPass(AtmosphereShader)
  composer.addPass(atmosphere)

  const target = { x: 0, y: 0 }
  const look = { x: 0, y: 0 }
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1
    target.y = (e.clientY / window.innerHeight) * 2 - 1
  })

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
  }
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  let flow = 0
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta()
    const t = clock.elapsedTime
    flow += dt * FLOW_SPEED

    windUniforms.uTime.value = t
    atmosphere.uniforms.uTime.value = t

    forest.update(flow)

    // gentle camera life + pointer parallax
    look.x += (target.x - look.x) * 0.04
    look.y += (target.y - look.y) * 0.04
    camera.position.x = look.x * 3.2 + Math.sin(t * 0.25) * 0.6
    camera.position.y = 3.4 + Math.sin(t * 0.4) * 0.25 - look.y * 1.2
    camera.lookAt(look.x * 4.0, 3.0 - look.y * 2.0, -30)

    composer.render()
  })
}
