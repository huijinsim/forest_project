import * as THREE from 'three'
import { CONFIG, PALETTE } from '../config.js'
import { ToonMaterial } from '../materials/ToonMaterial.js'
import { OutlineMaterial } from '../materials/OutlineMaterial.js'
import { SkyMaterial } from '../materials/SkyMaterial.js'
import { buildBroadleaf, buildConifer, buildBush } from './Tree.js'

// ─────────────────────────────────────────────────────────────
// 결정적 난수 (mulberry32) ─ seed가 같으면 매번 같은 숲이 생긴다.
// ─────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─────────────────────────────────────────────────────────────
// Forest
// 숲 전체를 3D로 조립한다: 하늘 → 바닥 → 먼 산 → 나무/덤불.
// 진짜 깊이(z)에 배치하고 안개로 공기원근을 줘 공간감을 만든다.
// ─────────────────────────────────────────────────────────────
export class Forest {
  constructor() {
    this.scene = new THREE.Scene()
    this.rng = mulberry32(CONFIG.forest.seed)

    // 매 프레임 uTime을 갱신해야 하는 머티리얼 모음
    this.materials = []

    this._buildSky()
    this._buildGround()
    this._buildMountains()
    this._buildTrees()
    this._buildBushes()
  }

  /** uTime이 필요한 머티리얼을 등록하고 그대로 돌려준다 */
  _track(mat) {
    this.materials.push(mat)
    return mat
  }

  // ── 하늘(스카이돔) ──────────────────────────────────────
  _buildSky() {
    const geo = new THREE.SphereGeometry(CONFIG.sky.radius, 32, 16)
    const sky = new THREE.Mesh(geo, new SkyMaterial())
    sky.renderOrder = -1
    this.scene.add(sky)
  }

  // ── 바닥 ────────────────────────────────────────────────
  _buildGround() {
    const geo = new THREE.PlaneGeometry(800, 800, 1, 1)
    geo.rotateX(-Math.PI / 2)
    const mat = this._track(new ToonMaterial({ color: PALETTE.ground, wind: false }))
    const ground = new THREE.Mesh(geo, mat)
    ground.position.y = 0
    this.scene.add(ground)
  }

  // ── 먼 산 (실루엣, 바람X, 안개로 흐려짐) ────────────────
  _buildMountains() {
    CONFIG.mountains.forEach(([x, z, h, r], i) => {
      const geo = new THREE.ConeGeometry(r, h, 8, 1)
      geo.translate(0, h / 2, 0)
      const color = PALETTE.mountain[i % PALETTE.mountain.length]
      const mat = this._track(new ToonMaterial({ color, wind: false }))
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, 0, z)
      this.scene.add(m)
    })
  }

  /** 나무 하나(줄기+잎, 각각 채움/외곽선)를 만들어 씬에 추가 */
  _addTree(proto, foliageMat, x, z, scale, rotY) {
    const group = new THREE.Group()
    group.position.set(x, 0, z)
    group.rotation.y = rotY
    group.scale.setScalar(scale)
    group.add(new THREE.Mesh(proto.trunk, this.trunkMat)) // 줄기 채움
    group.add(new THREE.Mesh(proto.trunk, this.outlineMat)) // 줄기 외곽선
    group.add(new THREE.Mesh(proto.foliage, foliageMat)) // 잎 채움
    group.add(new THREE.Mesh(proto.foliage, this.outlineMat)) // 잎 외곽선
    this.scene.add(group)
  }

  // ── 나무 ────────────────────────────────────────────────
  _buildTrees() {
    const f = CONFIG.forest
    const rng = this.rng

    // 잎 색 머티리얼 풀(셀 셰이딩, 바람O) + 줄기 + 외곽선(공유)
    this.foliageMats = PALETTE.foliage.map((c) =>
      this._track(new ToonMaterial({ color: c, wind: true })),
    )
    this.trunkMat = this._track(new ToonMaterial({ color: PALETTE.trunk, wind: true }))
    this.outlineMat = this._track(new OutlineMaterial(true))

    // 프로토타입 지오메트리 몇 개를 만들어 여러 나무가 공유 → 메모리 절약
    this.protos = []
    for (let i = 0; i < 6; i++) this.protos.push(buildBroadleaf(rng))
    for (let i = 0; i < 6; i++) this.protos.push(buildConifer(rng))

    const [cx, cz] = f.clearingCenter

    let placed = 0
    let guard = 0
    while (placed < f.treeCount && guard < f.treeCount * 40) {
      guard++
      const x = (rng() * 2 - 1) * f.areaX
      const z = f.zNear + rng() * (f.zFar - f.zNear) // zNear(앞) → zFar(뒤)

      // 빈터 안쪽은 비워둔다
      const dx = x - cx
      const dz = z - cz
      if (Math.sqrt(dx * dx + dz * dz) < f.clearingRadius) continue

      const proto = this.protos[Math.floor(rng() * this.protos.length)]
      const mat = this.foliageMats[Math.floor(rng() * this.foliageMats.length)]
      // 멀수록 살짝 작게 → 원근 강조
      const depth = (z - f.zFar) / (f.zNear - f.zFar) // 0(먼) ~ 1(가까운)
      const s = (0.85 + rng() * 0.7) * (0.7 + depth * 0.5)
      this._addTree(proto, mat, x, z, s, rng() * Math.PI * 2)
      placed++
    }

    // ── 좌우 프레이밍 큰 나무 (레퍼런스처럼 빈터를 감싸는 구도) ──
    const big = this.protos.filter((p) => p.height > 6)
    const pick = () => big[Math.floor(rng() * big.length)] || this.protos[0]
    this._addTree(pick(), this.foliageMats[0], -12.5, 6.5, 2.0, 0.4)
    this._addTree(pick(), this.foliageMats[1], 13.5, 7.0, 2.2, -0.5)
  }

  // ── 덤불 (작은 지면 장식) ───────────────────────────────
  _buildBushes() {
    const f = CONFIG.forest
    const rng = this.rng
    const bushMat = this._track(new ToonMaterial({ color: PALETTE.bush, wind: true }))

    for (let i = 0; i < f.bushCount; i++) {
      const { foliage } = buildBush(rng)
      const group = new THREE.Group()
      // 빈터 가장자리~숲 안쪽에 낮고 작게 흩뿌림
      const x = (rng() * 2 - 1) * (f.areaX * 0.7)
      const z = f.zNear - 4 - rng() * 70
      group.position.set(x, -0.2, z)
      group.scale.setScalar(0.5 + rng() * 0.7)
      group.add(new THREE.Mesh(foliage, bushMat))
      group.add(new THREE.Mesh(foliage, this.outlineMat))
      this.scene.add(group)
    }
  }

  /** 매 프레임: 모든 머티리얼 시간/튜닝 값 갱신 */
  update(elapsed) {
    for (const m of this.materials) m.update(elapsed)
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}
