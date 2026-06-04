import { Effect } from 'postprocessing'
import { Uniform } from 'three'

/**
 * Post-processing effect that gives the 3D scene the look of printed
 * illustration on textured paper.
 *
 * Passes applied (one shader, in order):
 *  1. Paper fibres  — two crossed fbm layers blended multiplicatively
 *  2. Micro grain   — per-pixel random noise for pencil/grain texture
 *  3. Warm grade    — slight cream/sepia colour shift (illustration ink)
 *  4. Vignette      — soft darkening around the screen edges
 */
const paperFrag = /* glsl */ `
  uniform float uTime;
  uniform float uGrain;
  uniform float uFiberScale;

  float h21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  // Low-frequency value noise for paper fibres
  float vNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), u.x),
               mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * vNoise(p);
      p = rot * p * 2.1;
      a *= 0.48;
    }
    return v;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 col = inputColor.rgb;

    // ── 1. Paper fibres ──────────────────────────────────────────────────────
    // Two fbm layers at orthogonal scales mimic horizontal & vertical fibres
    float fx = fbm(vec2(uv.x * uFiberScale,        uv.y * uFiberScale * 0.22));
    float fy = fbm(vec2(uv.x * uFiberScale * 0.22, uv.y * uFiberScale));
    float fiber = fx * 0.55 + fy * 0.45;
    col *= 0.97 + 0.03 * fiber;           // multiply: fibres darken very slightly

    // ── 2. Grain ─────────────────────────────────────────────────────────────
    // Animated per-pixel noise — changes every frame for authentic grain
    float grain = h21(uv * 1543.2 + vec2(fract(uTime * 0.07), 0.0));
    col += (grain - 0.5) * uGrain;

    // ── 3. Warm illustration grade ───────────────────────────────────────────
    // Very subtle warm shift — keep the illustration's own colours intact
    col *= vec3(1.015, 1.005, 0.985);
    col = clamp(col, 0.0, 1.0);

    // ── 4. Vignette ──────────────────────────────────────────────────────────
    float vig = smoothstep(1.35, 0.25, distance(uv, vec2(0.5)));
    col *= mix(0.97, 1.0, vig);

    outputColor = vec4(col, inputColor.a);
  }
`

interface PaperEffectOptions {
  grain?: number
  fiberScale?: number
}

export class PaperEffect extends Effect {
  constructor({ grain = 0.006, fiberScale = 105.0 }: PaperEffectOptions = {}) {
    super('PaperEffect', paperFrag, {
      uniforms: new Map<string, Uniform<number>>([
        ['uTime',       new Uniform(0)],
        ['uGrain',      new Uniform(grain)],
        ['uFiberScale', new Uniform(fiberScale)],
      ]),
    })
  }

  // Called automatically by EffectComposer each frame
  override update(
    _renderer: unknown,
    _inputBuffer: unknown,
    deltaTime: number,
  ): void {
    ;(this.uniforms.get('uTime') as Uniform<number>).value += deltaTime
  }
}
