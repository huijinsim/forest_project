// ─────────────────────────────────────────────────────────────
// sky.frag — 골든아워 하늘 (블루 → 피치 → 핑크 지평선)
// ─────────────────────────────────────────────────────────────

uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uHorizon;
uniform vec3 uSunset;

varying vec3 vDir;

void main() {
  vec3 dir = normalize(vDir);
  float t = dir.y * 0.5 + 0.5;
  t = pow(smoothstep(0.0, 0.95, t), 0.82);

  vec3 col = mix(uBottom, uTop, t);

  // 지평선 밴드 — 석양 핑크·피치
  float horizonBand = smoothstep(0.32, 0.5, t) * (1.0 - smoothstep(0.5, 0.68, t));
  col = mix(col, uHorizon, horizonBand * 0.55);
  col = mix(col, uSunset, horizonBand * 0.35);

  // 하단 글로우 (몽환적 빛 번짐)
  float glow = smoothstep(0.42, 0.0, t);
  col += uSunset * glow * 0.12;

  gl_FragColor = vec4(col, 1.0);
}
