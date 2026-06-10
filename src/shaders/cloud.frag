// ─────────────────────────────────────────────────────────────
// cloud.frag — 은은한 반투명 구름 (하늘에 녹아듦)
// ─────────────────────────────────────────────────────────────

uniform vec3 uColor;
uniform vec3 uFogColor;
uniform vec3 uSkyColor;
uniform float uFogFar;
uniform float uOpacity;
uniform float uSkyBlend;

varying float vFogDepth;

void main() {
  float fog = smoothstep(uFogFar * 0.35, uFogFar * 0.95, vFogDepth);
  vec3 col = mix(uColor, uFogColor, fog * 0.45);
  col = mix(uSkyColor, col, uSkyBlend);
  float alpha = uOpacity * (1.0 - fog * 0.35);
  gl_FragColor = vec4(col, alpha);
}
