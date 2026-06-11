// ─────────────────────────────────────────────────────────────
// treeModel.vert — GLB 나무: 텍스처 + 바람 + 안개
// ─────────────────────────────────────────────────────────────

#include ./lib/wind.glsl

uniform float uTime;
uniform float uWindSpeed;
uniform float uWindFreq;
uniform float uWindAmp;
uniform float uSwayBase;
uniform float uSwayTop;
uniform float uTreeHeight;

varying vec3 vNormalW;
varying float vFogDepth;
varying float vHeight;
varying vec2 vUv;

void main() {
  float hf = smoothstep(uSwayBase, uSwayTop, position.y);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec3 displaced = applyWind(position, worldPos.xyz, uTime, uWindSpeed, uWindFreq, uWindAmp, hf);

  vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vFogDepth = -mvPos.z;
  vHeight = clamp(position.y / max(uTreeHeight, 0.001), 0.0, 1.0);
  vUv = uv;

  gl_Position = projectionMatrix * mvPos;
}
