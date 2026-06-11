import * as THREE from 'three'
import { CONFIG, PALETTE, pickFoliageColor } from '../config.js'
import { ToonMaterial } from '../materials/ToonMaterial.js'
import { OutlineMaterial } from '../materials/OutlineMaterial.js'
import { GroundMaterial } from '../materials/GroundMaterial.js'
import { SkyMaterial } from '../materials/SkyMaterial.js'
import { buildConifer, buildDeciduous, buildSlender, buildBush, buildTreeByKind, TREE_KINDS } from './Tree.js'
import { buildGrassClump, buildCattailStalk, buildCattailTip, buildSmallFern } from './Flora.js'
import { CloudMaterial } from '../materials/CloudMaterial.js'
import { buildCloudByVariant } from './Cloud.js'
import { buildMountain, buildMountainRidge } from './Mountain.js'
import { Butterflies } from './Butterfly.js'

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

/** 나무 캐노피 XZ 반경 추정 (scale 적용 후) */
function estimateCanopyRadius(proto, scale) {
  switch (proto.kind) {
    case 'slender':
      return (0.5 + 0.06) * scale
    case 'deciduous':
      return (1.28 + 0.22) * scale
    case 'bush':
      return (0.52 + 0.12) * scale
    default:
      return (1.48 + 0.32) * scale
  }
}


export class Forest {
  constructor() {
    this.scene = new THREE.Scene()
    this.rng = mulberry32(CONFIG.forest.seed)
    this.materials = []
    this.pickables = []
    this.treeGroups = []

    this._initMaterials()
    this._buildSky()
    this._buildClouds()
    this._buildGround()
    this._buildMountains()
    this._buildTrees()
    this._buildTreeGrid()
    this._buildUnderstory()
    this._buildForeground()
    this.butterflies = new Butterflies(this.scene, this.rng, this.treeSlots, this.outlineMat)
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
    this.fernMat = this._track(new ToonMaterial({ color: PALETTE.fern, wind: true }))
    this.cattailStalkMat = this._track(new ToonMaterial({ color: PALETTE.cattailStalk, wind: true }))
    this.cattailTipMat = this._track(new ToonMaterial({ color: PALETTE.cattailTipBright, wind: true }))
    this.cloudMat = this._track(new CloudMaterial(PALETTE.cloud))
    this.cloudShadeMat = this._track(new CloudMaterial(PALETTE.cloudShade))
    this.cloudEntries = []
  }

  _foliageMat(color) {
    return this.foliageMatMap.get(color) ?? this.foliageMatMap.values().next().value
  }

  _buildSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.sky.radius, 32, 16),
      new SkyMaterial(),
    )
    sky.renderOrder = -2
    this.scene.add(sky)
  }

  /** 일러스트 뭉게구름 — 하늘(오크라)과 산(민트) 사이 레이어 */
  _buildClouds() {
    const rng = this.rng
    const cfg = CONFIG.clouds

    const addCloud = (x, y, z, scale, variant, shade) => {
      const geo = buildCloudByVariant(rng, variant)
      const mat = shade ? this.cloudShadeMat : this.cloudMat
      const g = new THREE.Group()
      g.position.set(x, y, z)
      g.scale.setScalar(scale)
      g.rotation.y = rng() * Math.PI * 2
      g.renderOrder = 1
      g.add(new THREE.Mesh(geo, mat))
      this.scene.add(g)
      this.cloudEntries.push({
        group: g,
        baseX: x,
        phase: rng() * Math.PI * 2,
        speed: 0.12 + rng() * 0.1,
        amp: 0.8 + rng() * 1.6,
      })
    }

    cfg.items.forEach(([x, y, z, scale, variant, shade]) => {
      addCloud(x, y, z, scale, variant, shade)
    })

    // 하늘에 흩뿌리는 보조 구름
    for (let i = 0; i < cfg.scatter; i++) {
      addCloud(
        (rng() * 2 - 1) * 130,
        24 + rng() * 28,
        -95 - rng() * 65,
        3.2 + rng() * 3.2,
        Math.floor(rng() * 3),
        rng() > 0.6 ? 1 : 0,
      )
    }
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(900, 900, 1, 1)
    geo.rotateX(-Math.PI / 2)
    const groundMat = this._track(new GroundMaterial())
    this.scene.add(new THREE.Mesh(geo, groundMat))

    // 빈터(일러스트 중앙 연한 바닥) — 질감 위에 살짝 밝게
    const [cx, cz] = CONFIG.forest.clearingCenter
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(CONFIG.forest.clearingRadius + 1.5, 24),
      this._track(new ToonMaterial({ color: PALETTE.groundWarm, wind: false })),
    )
    pad.rotation.x = -Math.PI / 2
    pad.position.set(cx, 0.015, cz)
    this.scene.add(pad)
  }

  _buildMountains() {
    const rng = this.rng
    const builders = [buildMountain, buildMountain, buildMountainRidge, buildMountain, buildMountainRidge]

    CONFIG.mountains.forEach(([x, z, width, height, depth], i) => {
      const build = builders[i % builders.length]
      const geo = build(width, height, depth, rng)
      const color = PALETTE.mountain[i % PALETTE.mountain.length]
      const mat = this._track(new ToonMaterial({ color, wind: false }))
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, 0, z)
      this.scene.add(m)
      const outline = new THREE.Mesh(geo, this.outlineMat)
      outline.position.copy(m.position)
      this.scene.add(outline)
    })
  }

  _canPlaceTree(x, z, radius) {
    const pad = CONFIG.forest.canopyPadding
    for (const slot of this.treeSlots) {
      const dx = x - slot.x
      const dz = z - slot.z
      const minD = (radius + slot.r) * pad
      if (dx * dx + dz * dz < minD * minD) return false
    }
    return true
  }

  _registerTree(x, z, radius) {
    this.treeSlots.push({ x, z, r: radius })
  }

  _tagInteractive(mesh, type, root) {
    mesh.userData.interactive = type
    mesh.userData.root = root
    this.pickables.push(mesh)
  }

  _addTree(proto, foliageMat, x, z, scale, rotY, trunkMat = this.trunkMat) {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.rotation.y = rotY
    g.scale.setScalar(scale)
    g.userData.interactive = 'tree'
    g.userData.root = g
    g.userData.focusY = (proto.height ?? 1.4) * scale * 0.45

    const add = (geo, mat, outline = true) => {
      const mesh = new THREE.Mesh(geo, mat)
      g.add(mesh)
      this._tagInteractive(mesh, 'tree', g)
      if (outline) {
        const ol = new THREE.Mesh(geo, this.outlineMat)
        g.add(ol)
      }
    }

    if (proto.trunk) add(proto.trunk, trunkMat)
    const folMat = proto.kind === 'bush' ? this.bushMat : foliageMat
    add(proto.foliage, folMat)
    this.scene.add(g)
    this.treeGroups.push(g)
    this._registerTree(x, z, estimateCanopyRadius(proto, scale))
  }

  /** 캐노피 겹침 없을 때만 배치 */
  _tryAddTree(proto, foliageMat, x, z, scale, rotY, trunkMat = this.trunkMat) {
    const r = estimateCanopyRadius(proto, scale)
    if (!this._canPlaceTree(x, z, r)) return false
    this._addTree(proto, foliageMat, x, z, scale, rotY, trunkMat)
    return true
  }

  _buildTrees() {
    const f = CONFIG.forest
    const rng = this.rng
    const [cx, cz] = f.clearingCenter
    this.treeSlots = []
    this.protosByKind = {}

    for (const kind of TREE_KINDS) {
      this.protosByKind[kind] = []
      for (let i = 0; i < 10; i++) this.protosByKind[kind].push(buildTreeByKind(rng, kind))
    }

    this._pickKind = (depth) => {
      if (depth < 0.22) return rng() < 0.5 ? 'slender' : 'bush'
      if (depth < 0.45) {
        const r = rng()
        if (r < 0.3) return 'bush'
        if (r < 0.6) return 'slender'
        return 'conifer'
      }
      if (depth < 0.72) {
        const r = rng()
        if (r < 0.12) return 'bush'
        if (r < 0.52) return 'conifer'
        return 'deciduous'
      }
      const r = rng()
      if (r < 0.1) return 'bush'
      if (r < 0.48) return 'deciduous'
      return 'conifer'
    }

    this._pickProto = (depth) => {
      const kind = this._pickKind(depth)
      const arr = this.protosByKind[kind]
      return arr[Math.floor(rng() * arr.length)]
    }

    let placed = 0
    let guard = 0

    // ── 층별 배치 — 캐노피 겹침 검사 ──
    while (placed < f.treeCount && guard < f.treeCount * 120) {
      guard++
      const row = Math.floor(rng() * f.rows)
      const depthT = row / (f.rows - 1 || 1)
      const z = f.zFar + (f.zNear - f.zFar) * depthT + (rng() - 0.5) * 6
      const x = (rng() * 2 - 1) * f.areaX * (0.6 + depthT * 0.42)

      const dx = x - cx
      const dz = z - cz
      if (Math.sqrt(dx * dx + dz * dz) < f.clearingRadius) continue

      const depth = (z - f.zFar) / (f.zNear - f.zFar)
      const color = pickFoliageColor(rng, depth)
      const proto = this._pickProto(depth)
      const raw = (0.7 + rng() * 0.55) * (0.55 + depth * 0.6)
      const s = THREE.MathUtils.clamp(raw, f.minTreeScale, f.maxTreeScale)
      const tMat = depth < 0.35 ? this.trunkDarkMat : this.trunkMat

      if (!this._tryAddTree(proto, this._foliageMat(color), x, z, s, rng() * Math.PI * 2, tMat)) {
        continue
      }
      placed++
    }

    // ── 좌우 프레이밍 ──
    const big = () => this.protosByKind.conifer[Math.floor(rng() * this.protosByKind.conifer.length)]
    const frameColor = PALETTE.foliageDark[0]
    const frameTrees = [
      [big(), frameColor, -12, 7, 1.85, 0.35],
      [big(), frameColor, 12.5, 8, 1.95, -0.4],
      [big(), PALETTE.foliageLight[1], -8, 5, 1.55, 0.2],
      [big(), PALETTE.foliageLight[2], 8.5, 6, 1.6, -0.25],
    ]
    for (const [proto, color, x, z, s, rot] of frameTrees) {
      this._tryAddTree(proto, this._foliageMat(color), x, z, s, rot)
    }

    // 좌우·원경 가장자리 — 숲이 둘러싸는 느낌
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const z = f.zFar + 20 + rng() * (f.zNear - f.zFar - 30)
      const x = side * (f.areaX * (0.72 + rng() * 0.28) + rng() * 6)
      const depth = (z - f.zFar) / (f.zNear - f.zFar)
      const proto = this._pickProto(depth)
      const color = pickFoliageColor(rng, depth)
      const s = THREE.MathUtils.clamp(0.85 + rng() * 0.55, f.minTreeScale, f.maxTreeScale)
      this._tryAddTree(proto, this._foliageMat(color), x, z, s, rng() * Math.PI * 2)
    }
  }

  /** 그리드 보조 배치 — 빈 공간을 메워 숲을 더 빽빽하게 */
  _buildTreeGrid() {
    const f = CONFIG.forest
    const rng = this.rng
    const [cx, cz] = f.clearingCenter
    const cols = 16
    const rows = 13
    let placed = 0

    for (let row = 0; row < rows && placed < f.fillGrid; row++) {
      for (let col = 0; col < cols && placed < f.fillGrid; col++) {
        if (rng() > 0.34) continue

        const depthT = row / (rows - 1)
        const z = f.zFar + (f.zNear - f.zFar) * depthT + (rng() - 0.5) * 3
        const x = (col / (cols - 1) - 0.5) * f.areaX * 1.05 + (rng() - 0.5) * 2.5

        const dx = x - cx
        const dz = z - cz
        if (Math.sqrt(dx * dx + dz * dz) < f.clearingRadius) continue

        const depth = (z - f.zFar) / (f.zNear - f.zFar)
        const proto = this._pickProto(depth)

        const color = pickFoliageColor(rng, depth)
        const s = THREE.MathUtils.clamp(0.65 + rng() * 0.5, f.minTreeScale, f.maxTreeScale * 0.9)
        if (!this._tryAddTree(proto, this._foliageMat(color), x, z, s, rng() * Math.PI * 2)) {
          continue
        }
        placed++
      }
    }
  }

  _buildUnderstory() {
    const f = CONFIG.forest
    const rng = this.rng

    for (let i = 0; i < f.bushCount; i++) {
      const dark = rng() > 0.45
      const { foliage } = buildBush(rng, dark)
      const g = new THREE.Group()
      const depthT = rng()
      const z = f.zNear - 0.5 - rng() * (f.zNear - f.zFar - 1)
      const x = (rng() * 2 - 1) * f.areaX * (0.7 + depthT * 0.28)
      g.position.set(x, -0.05, z)
      g.scale.setScalar(0.5 + rng() * 0.95)
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
    const [cx, cz] = f.clearingCenter

    const inClearing = (x, z) => {
      const dx = x - cx
      const dz = z - cz
      return Math.sqrt(dx * dx + dz * dz) < f.clearingRadius
    }

    const pickSpot = (nearBias = 0) => {
      for (let t = 0; t < 12; t++) {
        const z =
          nearBias > 0 && rng() < nearBias
            ? 3 + rng() * 22
            : f.zNear - 1 - rng() * (f.zNear - f.zFar - 2)
        const depth = (z - f.zFar) / (f.zNear - f.zFar)
        const x = (rng() * 2 - 1) * f.areaX * (0.65 + depth * 0.38)
        if (!inClearing(x, z)) return [x, z]
      }
      return [(rng() * 2 - 1) * f.areaX * 0.5, 5 + rng() * 12]
    }

    // 풀 — 숲 바닥 전역
    for (let i = 0; i < f.grassClumps; i++) {
      const [x, z] = pickSpot(0.35)
      const geo = buildGrassClump(rng, 4 + Math.floor(rng() * 4))
      const g = new THREE.Group()
      g.position.set(x, 0, z)
      g.rotation.y = rng() * Math.PI
      g.scale.setScalar(0.75 + rng() * 0.7)
      g.add(new THREE.Mesh(geo, this.grassMat))
      g.add(new THREE.Mesh(geo, this.outlineMat))
      this.scene.add(g)
    }

    // 갈대 — 전경·중경에 고르게
    for (let i = 0; i < f.cattails; i++) {
      const [x, z] = pickSpot(0.55)
      const h = 1.0 + rng() * 1.6
      const g = new THREE.Group()
      g.position.set(x, 0, z)
      g.rotation.y = rng() * Math.PI * 2

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

    // 작은 양치·잡초
    for (let i = 0; i < f.ferns; i++) {
      const [x, z] = pickSpot(0.4)
      const geo = buildSmallFern(rng)
      const g = new THREE.Group()
      g.position.set(x, 0, z)
      g.rotation.y = rng() * Math.PI * 2
      g.scale.setScalar(0.85 + rng() * 0.55)
      g.add(new THREE.Mesh(geo, this.fernMat))
      g.add(new THREE.Mesh(geo, this.outlineMat))
      this.scene.add(g)
    }
  }

  update(elapsed) {
    for (const m of this.materials) m.update(elapsed)
    this.butterflies?.update(elapsed)
    this.butterflies?.updateMaterials(elapsed)
    for (const c of this.cloudEntries) {
      c.group.position.x = c.baseX + Math.sin(elapsed * c.speed + c.phase) * c.amp
    }
  }

  getPickables() {
    return [...this.pickables, ...(this.butterflies?.pickables ?? [])]
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}
