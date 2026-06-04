import * as THREE from 'three'
import { CONFIG, PALETTE, pickFoliageColor } from '../config.js'
import { ToonMaterial } from '../materials/ToonMaterial.js'
import { OutlineMaterial } from '../materials/OutlineMaterial.js'
import { SkyMaterial } from '../materials/SkyMaterial.js'
import { buildConifer, buildDeciduous, buildSlender, buildBush } from './Tree.js'
import { buildGrassClump, buildCattailStalk, buildCattailTip } from './Flora.js'

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

/** 물결 실루엣 산 (원뿔 대신 Lathe) */
function mountainGeometry(h, radius, rng) {
  const pts = []
  for (let i = 0; i <= 14; i++) {
    const t = i / 14
    const y = h * t
    const bulge = Math.pow(Math.sin(t * Math.PI), 0.9) * (1 - t * 0.12)
    const wobble = 1 + 0.1 * Math.sin(t * 7 + rng() * 12)
    pts.push(new THREE.Vector2(Math.max(0.1, radius * bulge * wobble), y))
  }
  const g = new THREE.LatheGeometry(pts, 12)
  g.translate(0, 0, 0)
  return g
}

export class Forest {
  constructor() {
    this.scene = new THREE.Scene()
    this.rng = mulberry32(CONFIG.forest.seed)
    this.materials = []

    this._initMaterials()
    this._buildSky()
    this._buildGround()
    this._buildMountains()
    this._buildTrees()
    this._buildUnderstory()
    this._buildForeground()
  }

  _track(mat) {
    this.materials.push(mat)
    return mat
  }

  _initMaterials() {
    const foliageColors = [...PALETTE.foliageDark, ...PALETTE.foliageLight]
    this.foliageMatMap = new Map()
    for (const c of foliageColors) {
      this.foliageMatMap.set(c, this._track(new ToonMaterial({ color: c, wind: true })))
    }

    this.trunkMat = this._track(new ToonMaterial({ color: PALETTE.trunk, wind: true }))
    this.trunkDarkMat = this._track(new ToonMaterial({ color: PALETTE.trunkDark, wind: true }))
    this.outlineMat = this._track(new OutlineMaterial(true))
    this.bushMat = this._track(new ToonMaterial({ color: PALETTE.bush, wind: true }))
    this.bushDarkMat = this._track(new ToonMaterial({ color: PALETTE.bushDark, wind: true }))
    this.grassMat = this._track(new ToonMaterial({ color: PALETTE.grass, wind: true }))
    this.cattailStalkMat = this._track(new ToonMaterial({ color: PALETTE.cattailStalk, wind: true }))
    this.cattailTipMat = this._track(new ToonMaterial({ color: PALETTE.cattailTipBright, wind: true }))
  }

  _foliageMat(color) {
    return this.foliageMatMap.get(color) ?? this.foliageMatMap.values().next().value
  }

  _buildSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.sky.radius, 32, 16),
      new SkyMaterial(),
    )
    sky.renderOrder = -1
    this.scene.add(sky)
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(900, 900)
    geo.rotateX(-Math.PI / 2)
    const mat = this._track(new ToonMaterial({ color: PALETTE.ground, wind: false }))
    this.scene.add(new THREE.Mesh(geo, mat))

    // 빈터(일러스트 중앙 연한 바닥)
    const [cx, cz] = CONFIG.forest.clearingCenter
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(CONFIG.forest.clearingRadius + 1.5, 24),
      this._track(new ToonMaterial({ color: PALETTE.groundWarm, wind: false })),
    )
    pad.rotation.x = -Math.PI / 2
    pad.position.set(cx, 0.02, cz)
    this.scene.add(pad)
  }

  _buildMountains() {
    const rng = this.rng
    CONFIG.mountains.forEach(([x, z, h, r], i) => {
      const geo = mountainGeometry(h, r, rng)
      const mat = this._track(
        new ToonMaterial({ color: PALETTE.mountain[i % PALETTE.mountain.length], wind: false }),
      )
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, 0, z)
      this.scene.add(m)
    })
  }

  _addTree(proto, foliageMat, x, z, scale, rotY, trunkMat = this.trunkMat) {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.rotation.y = rotY
    g.scale.setScalar(scale)

    const add = (geo, mat, outline = true) => {
      g.add(new THREE.Mesh(geo, mat))
      if (outline) g.add(new THREE.Mesh(geo, this.outlineMat))
    }

    add(proto.trunk, trunkMat)
    add(proto.foliage, foliageMat)
    this.scene.add(g)
  }

  _buildTrees() {
    const f = CONFIG.forest
    const rng = this.rng
    const [cx, cz] = f.clearingCenter

    this.protosConifer = []
    this.protosDeciduous = []
    this.protosSlender = []
    for (let i = 0; i < 12; i++) this.protosConifer.push(buildConifer(rng))
    for (let i = 0; i < 10; i++) this.protosDeciduous.push(buildDeciduous(rng))
    for (let i = 0; i < 8; i++) this.protosSlender.push(buildSlender(rng))

    const pickProto = (depth) => {
      if (depth < 0.28) return this.protosSlender[Math.floor(rng() * this.protosSlender.length)]
      if (depth < 0.55) return this.protosConifer[Math.floor(rng() * this.protosConifer.length)]
      if (depth < 0.78) {
        return rng() > 0.35
          ? this.protosConifer[Math.floor(rng() * this.protosConifer.length)]
          : this.protosDeciduous[Math.floor(rng() * this.protosDeciduous.length)]
      }
      return rng() > 0.4
        ? this.protosDeciduous[Math.floor(rng() * this.protosDeciduous.length)]
        : this.protosConifer[Math.floor(rng() * this.protosConifer.length)]
    }

    let placed = 0
    let guard = 0

    // ── 층별(row) 밀집 배치 → 일러스트처럼 겹침 ──
    while (placed < f.treeCount && guard < f.treeCount * 50) {
      guard++
      const row = Math.floor(rng() * f.rows)
      const depthT = row / (f.rows - 1 || 1)
      const z = f.zFar + (f.zNear - f.zFar) * depthT + (rng() - 0.5) * 8
      const x = (rng() * 2 - 1) * f.areaX * (0.55 + depthT * 0.45)

      const dx = x - cx
      const dz = z - cz
      if (Math.sqrt(dx * dx + dz * dz) < f.clearingRadius) continue

      const depth = (z - f.zFar) / (f.zNear - f.zFar)
      const color = pickFoliageColor(rng, depth)
      const proto = pickProto(depth)
      const s = (0.75 + rng() * 0.65) * (0.6 + depth * 0.65)
      const tMat = depth < 0.35 ? this.trunkDarkMat : this.trunkMat

      this._addTree(proto, this._foliageMat(color), x, z, s, rng() * Math.PI * 2, tMat)
      placed++
    }

    // ── 좌우 프레이밍 큰 침엽수 (일러스트 양쪽 큰 나무) ──
    const big = () => this.protosConifer[Math.floor(rng() * 4)]
    const frameColor = PALETTE.foliageDark[0]
    this._addTree(big(), this._foliageMat(frameColor), -14, 8, 2.4, 0.35)
    this._addTree(big(), this._foliageMat(frameColor), 15, 9, 2.6, -0.4)
    this._addTree(big(), this._foliageMat(PALETTE.foliageLight[1]), -9, 4, 1.9, 0.2)
    this._addTree(big(), this._foliageMat(PALETTE.foliageLight[2]), 10, 5, 2.0, -0.25)
  }

  _buildUnderstory() {
    const f = CONFIG.forest
    const rng = this.rng

    for (let i = 0; i < f.bushCount; i++) {
      const dark = rng() > 0.45
      const { foliage } = buildBush(rng, dark)
      const g = new THREE.Group()
      const x = (rng() * 2 - 1) * f.areaX * 0.85
      const z = f.zNear - 1 - rng() * 100
      g.position.set(x, -0.05, z)
      g.scale.setScalar(0.55 + rng() * 0.85)
      g.rotation.y = rng() * Math.PI * 2
      const mat = dark ? this.bushDarkMat : this.bushMat
      g.add(new THREE.Mesh(foliage, mat))
      g.add(new THREE.Mesh(foliage, this.outlineMat))
      this.scene.add(g)
    }
  }

  _buildForeground() {
    const rng = this.rng
    const f = CONFIG.forest

    // 하단 모서리 풀
    for (let i = 0; i < f.grassClumps; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const geo = buildGrassClump(rng, 4 + Math.floor(rng() * 4))
      const g = new THREE.Group()
      g.position.set(
        side * (8 + rng() * 10),
        0,
        6 + rng() * 10,
      )
      g.rotation.y = rng() * Math.PI
      g.scale.setScalar(0.9 + rng() * 0.6)
      g.add(new THREE.Mesh(geo, this.grassMat))
      g.add(new THREE.Mesh(geo, this.outlineMat))
      this.scene.add(g)
    }

    // 갈대 (주황·노랑 끝) — 일러스트 하단 포인트 컬러
    for (let i = 0; i < f.cattails; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const h = 1.2 + rng() * 1.5
      const g = new THREE.Group()
      g.position.set(side * (5 + rng() * 9), 0, 7 + rng() * 7)
      g.rotation.y = (rng() - 0.5) * 0.4

      const stalkGeo = buildCattailStalk(h)
      const tipGeo = buildCattailTip(rng)
      const tip = new THREE.Mesh(tipGeo, this.cattailTipMat)
      tip.position.y = h + 0.08

      g.add(new THREE.Mesh(stalkGeo, this.cattailStalkMat))
      g.add(new THREE.Mesh(stalkGeo, this.outlineMat))
      g.add(tip)
      g.add(new THREE.Mesh(tipGeo, this.outlineMat))
      this.scene.add(g)
    }
  }

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
