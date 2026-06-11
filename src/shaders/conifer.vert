// ─────────────────────────────────────────────────────────────
// conifer.vert — 침엽 층별 수직 그라데이션용
// ─────────────────────────────────────────────────────────────

#include ./lib/wind.glsl

attribute float aHeight;

uniform float uTime;
uniform float uWindSpeed;
uniform float uWindFreq;
uniform float uWindAmp;
uniform float uSwayBase;
uniform float uSwayTop;

varying vec3 vNormalW;
varying float vFogDepth;
varying float vHeight;

void main() {
  float hf = smoothstep(uSwayBase, uSwayTop, position.y);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec3 displaced = applyWind(position, worldPos.xyz, uTime, uWindSpeed, uWindFreq, uWindAmp, hf);

  vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vFogDepth = -mvPos.z;
  vHeight = aHeight;

  gl_Position = projectionMatrix * mvPos;
}
