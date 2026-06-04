// ─────────────────────────────────────────────────────────────
// toon.vert ─ 셀 셰이딩 채움 정점 셰이더
// 바람으로 정점을 흔들고, 월드 노멀과 안개용 깊이를 프래그먼트로 넘긴다.
// ─────────────────────────────────────────────────────────────

#include ./lib/wind.glsl

uniform float uTime;
uniform float uWindSpeed;
uniform float uWindFreq;
uniform float uWindAmp;
uniform float uSwayBase;   // 이 높이 아래는 흔들림 0 (줄기)
uniform float uSwayTop;    // 이 높이 이상은 흔들림 최대 (잎 끝)

varying vec3 vNormalW;     // 월드 공간 노멀
varying float vFogDepth;   // 카메라로부터의 거리(뷰 z)

void main() {
  // local y 높이로 흔들림 세기 결정
  float hf = smoothstep(uSwayBase, uSwayTop, position.y);

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec3 displaced = applyWind(position, worldPos.xyz, uTime, uWindSpeed, uWindFreq, uWindAmp, hf);

  vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);

  vNormalW = normalize(mat3(modelMatrix) * normal);
  vFogDepth = -mvPos.z;

  gl_Position = projectionMatrix * mvPos;
}
