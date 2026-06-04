import { Effect } from 'postprocessing'
import { Uniform } from 'three'

// Light "marie-louise" paper grain + edge ink-bleed, kept subtle so the
// hand-drawn 3D scene reads as printed illustration — not muddy texture.
const frag = /* glsl */ `
  uniform float uTime;
  uniform float uGrain;

  float h21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x),
               mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 col = inputColor.rgb;

    // very faint paper fibre
    float fibre = vNoise(uv * vec2(220.0, 48.0)) * 0.5 + vNoise(uv * vec2(48.0, 220.0)) * 0.5;
    col *= 0.985 + 0.015 * fibre;

    // fine animated grain
    float grain = h21(uv * 1731.0 + vec2(fract(uTime * 0.05), 0.0));
    col += (grain - 0.5) * uGrain;

    // soft paper-mat vignette
    float vig = smoothstep(1.25, 0.32, distance(uv, vec2(0.5)));
    col *= mix(0.93, 1.0, vig);

    outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
  }
`

interface InkPaperOptions {
  grain?: number
}

export class InkPaperEffect extends Effect {
  constructor({ grain = 0.012 }: InkPaperOptions = {}) {
    super('InkPaperEffect', frag, {
      uniforms: new Map<string, Uniform<number>>([
        ['uTime', new Uniform(0)],
        ['uGrain', new Uniform(grain)],
      ]),
    })
  }

  override update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number): void {
    ;(this.uniforms.get('uTime') as Uniform<number>).value += deltaTime
  }
}
