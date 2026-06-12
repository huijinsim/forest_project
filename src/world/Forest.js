import * as THREE from 'three'
import { CONFIG, PALETTE } from '../config.js'
import { ToonMaterial } from '../materials/ToonMaterial.js'
import { OutlineMaterial } from '../materials/OutlineMaterial.js'
import { GroundMaterial } from '../materials/GroundMaterial.js'
import { SkyMaterial } from '../materials/SkyMaterial.js'
import { buildBush } from './Tree.js'
import { buildGrassClump, buildCattailStalk, buildCattailTip, buildSmallFern } from './Flora.js'
import { CloudMaterial } from '../materials/CloudMaterial.js'
import { buildCloudByVariant } from './Cloud.js'
import { buildMountain, buildMountainRidge } from './Mountain.js'
import { Butterflies } from './Butterfly.js'
import { createTreeInstances, treeFocusRoot } from './TreeModel.js'

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

export class Forest {
  /** @param {Awaited<ReturnType<import('./TreeModel.js').loadTreeTemplate>>} treeTemplate */
  constructor(treeTemplate) {
    this.scene = new THREE.Scene()
    this.rng = mulberry32(CONFIG.forest.seed)
    this.materials = []
    this.pickables = []
    this.treeTemplate = treeTemplate
    this.treePlacements = []
    this.treeInstancedMesh = null

    this._initMaterials()
    this._buildSky()
    this._buildClouds()
    this._buildGround()
    this._buildMountains()
    this._buildTrees()
    this._buildTreeInstances()
    this._buildUnderstory()
    this._buildForeground()
    this.butterflies = new Butterflies(this.scene, this.rng, this.treeSlots, this.outlineMat)
  }

  _track(mat) {
    this.materials.push(mat)
    return mat
  }

  _initMaterials() {
    this.outlineMat = this._track(new OutlineMaterial(true))
    this.bushMat = this._track(new ToonMaterial({ color: PALETTE.bush, wind: true }))
    this.grassMat = this._track(new ToonMaterial({ color: PALETTE.grass, wind: true }))
    this.fernMat = this._track(new ToonMaterial({ color: PALETTE.fern, wind: true }))
    this.cattailStalkMat = this._track(new ToonMaterial({ color: PALETTE.cattailStalk, wind: true }))
    this.cattailTipMat = this._track(new ToonMaterial({ color: PALETTE.cattailTipBright, wind: true }))
    this.cloudMat = this._track(new CloudMaterial(PALETTE.cloud))
    this.cloudShadeMat = this._track(new CloudMaterial(PALETTE.cloudShade))
    this.cloudEntries = []
  }

  _buildSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.sky.radius, 32, 16),
      new SkyMaterial(),
    )
    sky.renderOrder = -2
    this.scene.add(sky)
  }

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

  /** GLB 나무 배치 기록 (InstancedMesh는 나중에 한 번에 생성) */
  _tryAddTree(x, z, scale, rotY) {
    const f = CONFIG.forest
    const r = this.treeTemplate.radius * scale * f.canopyRadiusScale
    if (!this._canPlaceTree(x, z, r)) return false
    this.treePlacements.push({
      x,
      z,
      scale,
      rotY,
      focusY: this.treeTemplate.height * scale * 0.45,
    })
    this._registerTree(x, z, r)
    return true
  }

  _buildTreeInstances() {
    if (!this.treePlacements.length) return
    this.treeInstancedMesh = createTreeInstances(this.treeTemplate, this.treePlacements)
    this._track(this.treeInstancedMesh.material)
    this.scene.add(this.treeInstancedMesh)
    this.pickables.push(this.treeInstancedMesh)
  }

  getTreeFocusRoot(instanceId) {
    return treeFocusRoot(this.treePlacements[instanceId])
  }

  _buildTrees() {
    const f = CONFIG.forest
    const rng = this.rng
    const [cx, cz] = f.clearingCenter
    this.treeSlots = []

    let placed = 0
    let guard = 0

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
      const raw = (0.7 + rng() * 0.55) * (0.55 + depth * 0.6)
      const s = THREE.MathUtils.clamp(raw, f.minTreeScale, f.maxTreeScale)

      if (!this._tryAddTree(x, z, s, rng() * Math.PI * 2)) continue
      placed++
    }
  }

  _buildUnderstory() {
    const f = CONFIG.forest
    const rng = this.rng

    for (let i = 0; i < f.bushCount; i++) {
      const { foliage } = buildBush(rng)
      const g = new THREE.Group()
      const depthT = rng()
      const z = f.zNear - 0.5 - rng() * (f.zNear - f.zFar - 1)
      const x = (rng() * 2 - 1) * f.areaX * (0.7 + depthT * 0.28)
      g.position.set(x, -0.05, z)
      g.scale.setScalar(0.5 + rng() * 0.95)
      g.rotation.y = rng() * Math.PI * 2
      g.add(new THREE.Mesh(foliage, this.bushMat))
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
    const sharedGeo = this.treeTemplate?.geometry
    const sharedMat = this.treeTemplate?.material
    sharedGeo?.dispose()
    sharedMat?.dispose()
    this.scene.traverse((o) => {
      if (o.geometry && o.geometry !== sharedGeo) o.geometry.dispose()
      if (o.material && o.material !== sharedMat) o.material.dispose()
    })
  }
}
