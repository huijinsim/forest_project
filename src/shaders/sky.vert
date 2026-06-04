// ─────────────────────────────────────────────────────────────
// sky.vert ─ 스카이돔
// 구의 로컬 좌표를 그대로 방향 벡터로 넘겨 그라데이션에 사용한다.
// ─────────────────────────────────────────────────────────────

varying vec3 vDir;

void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
