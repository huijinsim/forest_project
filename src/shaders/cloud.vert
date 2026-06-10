// ─────────────────────────────────────────────────────────────
// cloud.vert — 구름 정점: 하늘에서 천천히 표류
// ─────────────────────────────────────────────────────────────

uniform float uTime;
uniform float uDrift; // 표류 진폭

varying float vFogDepth;

void main() {
  vec3 pos = position;
  // y가 높을수록 더 많이 흔들림 (가벼운 구름)
  float k = smoothstep(-0.5, 1.2, pos.y);
  pos.x += sin(uTime * 0.22 + pos.y * 0.35 + pos.z * 0.12) * uDrift * k;
  pos.z += cos(uTime * 0.18 + pos.x * 0.2) * uDrift * 0.35 * k;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
