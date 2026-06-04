/**
 * Layer vertex shader.
 *
 * Wind: height-weighted sinusoidal displacement on the x-axis.
 * Only active when uWind > 0, and the plane must have enough segments
 * (at least 20×20) for the displacement to look smooth.
 */
const LAYER_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec2  vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    if (uWind > 0.001) {
      // uv.y == 0 at bottom, 1 at top → top sways more
      float h = uv.y * uv.y;
      float sway =
        sin(uTime * 1.05 + position.x * 0.85) * 0.022 +
        sin(uTime * 0.62 + position.z * 0.55 + position.y * 0.3) * 0.013;
      pos.x += sway * h * uWind;
      // subtle vertical bob so it feels alive, not mechanical
      pos.y += cos(uTime * 0.78 + position.x * 0.7) * 0.006 * h * uWind;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export default LAYER_VERT
