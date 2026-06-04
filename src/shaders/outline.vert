// ─────────────────────────────────────────────────────────────
// outline.vert ─ 잉크 외곽선 (inverted-hull 기법)
// 메쉬의 뒷면(BackSide)을 노멀 방향으로 살짝 부풀려 그리면
// 실루엣 가장자리만 먹색 테두리로 남는다 → 손그림 펜선 느낌.
// 채움(toon.vert)과 동일한 바람을 적용해야 테두리가 잎을 정확히 따라간다.
// ─────────────────────────────────────────────────────────────

#include ./lib/wind.glsl

uniform float uTime;
uniform float uWindSpeed;
uniform float uWindFreq;
uniform float uWindAmp;
uniform float uSwayBase;
uniform float uSwayTop;
uniform float uOutline;    // 노멀 방향 팽창 두께

varying float vFogDepth;

void main() {
  float hf = smoothstep(uSwayBase, uSwayTop, position.y);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec3 displaced = applyWind(position, worldPos.xyz, uTime, uWindSpeed, uWindFreq, uWindAmp, hf);

  // 노멀 방향으로 팽창 → 외곽선 두께
  vec3 inflated = displaced + normalize(normal) * uOutline;

  vec4 mvPos = modelViewMatrix * vec4(inflated, 1.0);
  vFogDepth = -mvPos.z;

  gl_Position = projectionMatrix * mvPos;
}
