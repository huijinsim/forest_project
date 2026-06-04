// ─────────────────────────────────────────────────────────────
// sky.frag — 따뜻한 오크라 하늘 (일러스트 상단 #E5C582 → 지평 #F3E5AB)
// ─────────────────────────────────────────────────────────────

uniform vec3 uTop;
uniform vec3 uBottom;

varying vec3 vDir;

void main() {
  float t = normalize(vDir).y * 0.5 + 0.5;
  t = pow(smoothstep(0.0, 0.92, t), 0.85);
  vec3 col = mix(uBottom, uTop, t);
  gl_FragColor = vec4(col, 1.0);
}
