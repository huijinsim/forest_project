// ─────────────────────────────────────────────────────────────
// wind.glsl ─ 바람에 의한 정점 변위 (toon.vert / outline.vert 공용)
// 같은 함수를 외곽선과 채움이 함께 써야 외곽선이 잎을 정확히 따라간다.
// heightFactor(0~1): 캐노피 위쪽일수록 1 → 잎 끝이 더 크게 흔들린다.
// ─────────────────────────────────────────────────────────────

#include ./noise.glsl

vec3 applyWind(
  vec3 localPos,
  vec3 worldPos,
  float time,
  float speed,
  float freq,
  float amp,
  float heightFactor
) {
  // 나무마다 위상이 달라지도록 월드 좌표를 위상에 섞는다.
  float phase = time * speed + worldPos.x * freq + worldPos.z * freq * 0.7;

  // 결이 흐르는 느낌을 주는 저주파 노이즈
  float n = valueNoise(vec2(worldPos.x * 0.25 + time * 0.15, worldPos.z * 0.25));

  float dx = (sin(phase) * 0.7 + (n - 0.5) * 0.8) * amp * heightFactor;
  float dz = (cos(phase * 0.9) * 0.5) * amp * heightFactor;

  return localPos + vec3(dx, 0.0, dz);
}
