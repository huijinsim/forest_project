// ─────────────────────────────────────────────────────────────
// sky.frag — 오크라 하늘 + 지평선 밴드 (산/구름과 구분)
// ─────────────────────────────────────────────────────────────

uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uHorizon;

varying vec3 vDir;

void main() {
  vec3 dir = normalize(vDir);
  float t = dir.y * 0.5 + 0.5;
  t = pow(smoothstep(0.0, 0.92, t), 0.85);

  vec3 col = mix(uBottom, uTop, t);

  // 지평선 근처(산·구름 뒤 배경) — 살짝 다른 톤
  float horizonBand = smoothstep(0.38, 0.52, t) * (1.0 - smoothstep(0.52, 0.62, t));
  col = mix(col, uHorizon, horizonBand * 0.45);

  gl_FragColor = vec4(col, 1.0);
}
