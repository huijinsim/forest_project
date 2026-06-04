/**
 * Sky fragment shader — vertical gradient with dithered banding removal.
 * Rendered on a large back-plane; no PNG needed.
 */
const SKY_FRAG = /* glsl */ `
  uniform vec3  uTop;
  uniform vec3  uHorizon;
  uniform float uTime;
  varying vec2  vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float t = pow(vUv.y, 0.8);
    vec3 col = mix(uHorizon, uTop, t);

    // subtle moving cloud wisps baked into the sky (no extra PNG needed)
    float cx = vUv.x * 3.5 - uTime * 0.018;
    float cy = (vUv.y - 0.55) * 6.0;
    float wisp = smoothstep(0.6, 1.0,
      fract(sin(cx * 3.2 + cy * 1.7) * 43758.5) * fract(sin(cx * 1.1 + cy * 4.3) * 23421.6));
    col = mix(col, vec3(0.98, 0.96, 0.90), wisp * 0.22 * smoothstep(0.3, 0.7, vUv.y));

    // dither to kill colour-banding on gradients
    col += (hash(vUv * 500.0 + uTime) - 0.5) * (1.0 / 255.0) * 2.0;

    gl_FragColor = vec4(col, 1.0);
  }
`

export const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export default SKY_FRAG
