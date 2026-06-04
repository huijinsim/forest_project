import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────
// Loader
// 텍스처를 비동기로 불러오고 진행률을 콜백으로 알려준다.
// THREE.LoadingManager를 사용해 여러 텍스처를 한 번에 추적한다.
// ─────────────────────────────────────────────────────────────
export class Loader {
  constructor() {
    this.manager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.manager)
    /** @type {Map<string, THREE.Texture>} 같은 URL 중복 로드 방지 캐시 */
    this.cache = new Map()
  }

  /**
   * 여러 텍스처 URL을 한 번에 로드한다.
   * @param {string[]} urls
   * @param {(pct:number)=>void} [onProgress] 0~1 진행률
   * @returns {Promise<Map<string, THREE.Texture>>}
   */
  loadTextures(urls, onProgress) {
    const unique = [...new Set(urls)]

    this.manager.onProgress = (_url, loaded, total) => {
      if (onProgress) onProgress(total === 0 ? 1 : loaded / total)
    }

    return new Promise((resolve, reject) => {
      this.manager.onError = (url) => reject(new Error(`텍스처 로드 실패: ${url}`))
      this.manager.onLoad = () => resolve(this.cache)

      for (const url of unique) {
        if (this.cache.has(url)) continue
        this.textureLoader.load(url, (tex) => {
          // 손그림 일러스트는 색을 그대로 보존해야 하므로 sRGB로 해석
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.generateMipmaps = true
          tex.anisotropy = 4
          this.cache.set(url, tex)
        })
      }

      // 로드할 새 텍스처가 하나도 없으면 onLoad가 안 불릴 수 있어 즉시 resolve
      if (unique.every((u) => this.cache.has(u))) resolve(this.cache)
    })
  }
}
