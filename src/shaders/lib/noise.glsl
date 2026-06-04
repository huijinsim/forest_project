// ─────────────────────────────────────────────────────────────
// noise.glsl  ─ 여러 셰이더에서 #include 해서 재사용하는 노이즈 청크
// (바람 흔들림 변주, 종이 질감 그레인 등에 사용)
// ─────────────────────────────────────────────────────────────

// 2D 의사난수: 좌표 하나당 0~1 난수
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 부드러운 값 노이즈(value noise): 격자 난수를 보간
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // 헤르미트 보간으로 부드럽게
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i + vec2(0.0, 0.0));
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
