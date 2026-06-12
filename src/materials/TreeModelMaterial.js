import * as THREE from 'three'
import { CONFIG, PALETTE } from '../config.js'
import vertexShader from '../shaders/treeModel.vert'
import fragmentShader from '../shaders/treeModel.frag'

// ─────────────────────────────────────────────────────────────
// TreeModelMaterial — GLB 텍스처 + 바닥 톤 맞춤 셰이딩
// ─────────────────────────────────────────────────────────────
export class TreeModelMaterial extends THREE.ShaderMaterial {
  /**
   * @param {object} opts
   * @param {THREE.Texture|null} [opts.map]
   * @param {number} opts.treeHeight
   * @param {object} [opts.materialCfg]
   */
  constructor({ map = null, treeHeight, materialCfg }) {
    const cfg = materialCfg ?? CONFIG.forest.treeModelMaterial
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uMap: { value: map },
        uHasMap: { value: map ? 1 : 0 },
        uTint: { value: new THREE.Color(cfg.tint) },
        uColorTop: { value: new THREE.Color(cfg.colorTop ?? PALETTE.groundPatchLight) },
        uColorBottom: { value: new THREE.Color(cfg.colorBottom ?? PALETTE.groundPatchDark) },
        uGroundTone: { value: new THREE.Color(cfg.groundTone ?? PALETTE.ground) },
        uGroundMix: { value: cfg.groundMix ?? 0.3 },
        uVariation: { value: cfg.variation ?? 0.12 },
        uBrightness: { value: cfg.brightness },
        uSaturation: { value: cfg.saturation },
        uTreeHeight: { value: treeHeight },

        uTime: { value: 0 },
        uWindSpeed: { value: CONFIG.wind.speed },
        uWindFreq: { value: CONFIG.wind.frequency },
        uWindAmp: { value: CONFIG.wind.amplitude },
        uSwayBase: { value: CONFIG.wind.swayBase },
        uSwayTop: { value: CONFIG.wind.swayTop },

        uLightDir: { value: new THREE.Vector3(...CONFIG.light.direction).normalize() },
        uLightColor: { value: new THREE.Color(CONFIG.light.color) },
        uAmbient: { value: CONFIG.light.ambient },
        uHighlight: { value: CONFIG.light.highlight },
        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uFogNear: { value: CONFIG.fog.near },
        uFogFar: { value: CONFIG.fog.far },
      },
    })
  }

  update(elapsed) {
    const u = this.uniforms
    u.uTime.value = elapsed
    u.uWindSpeed.value = CONFIG.wind.speed
    u.uWindFreq.value = CONFIG.wind.frequency
    u.uWindAmp.value = CONFIG.wind.amplitude
    u.uAmbient.value = CONFIG.light.ambient
    u.uHighlight.value = CONFIG.light.highlight
    u.uFogNear.value = CONFIG.fog.near
    u.uFogFar.value = CONFIG.fog.far
  }
}
