// ─────────────────────────────────────────────────────────────
// sky.frag ─ 위아래 2색 그라데이션 하늘
// 방향 벡터의 y로 위(크림)↔아래(연두)를 보간한다.
// ─────────────────────────────────────────────────────────────

uniform vec3 uTop;
uniform vec3 uBottom;

varying vec3 vDir;

void main() {
  float t = normalize(vDir).y * 0.5 + 0.5;
  t = smoothstep(0.05, 0.85, t);
  vec3 col = mix(uBottom, uTop, t);
  gl_FragColor = vec4(col, 1.0);
}
