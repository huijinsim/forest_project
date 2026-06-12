// ─────────────────────────────────────────────────────────────
// treeModel.vert — InstancedMesh + 텍스처 + 바람 + 안개
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
varying vec2 vWorldXZ;

void main() {
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.0);
  #endif

  mat4 wm = modelMatrix * im;
  float hf = smoothstep(uSwayBase, uSwayTop, position.y);
  vec4 worldPos = wm * vec4(position, 1.0);
  vec3 displaced = applyWind(position, worldPos.xyz, uTime, uWindSpeed, uWindFreq, uWindAmp, hf);

  vec4 worldFinal = wm * vec4(displaced, 1.0);
  vec4 mvPos = viewMatrix * worldFinal;
  vNormalW = normalize(mat3(wm) * normal);
  vFogDepth = -mvPos.z;
  vHeight = clamp(position.y / max(uTreeHeight, 0.001), 0.0, 1.0);
  vUv = uv;
  vWorldXZ = worldFinal.xz;

  gl_Position = projectionMatrix * mvPos;
}
