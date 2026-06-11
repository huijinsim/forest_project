// ─────────────────────────────────────────────────────────────
// toon.frag ─ 부드러운 일러스트형 음영 + 공기원근
// ─────────────────────────────────────────────────────────────

uniform vec3 uBaseColor;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uHighlight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vNormalW;
varying float vFogDepth;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);

  float ndl = dot(N, L) * 0.5 + 0.5;

  // 명암 대비 완화 — 원경에서 너무 어둡지 않게
  float shade = smoothstep(0.28, 0.52, ndl) * 0.16 + smoothstep(0.5, 0.82, ndl) * 0.22 + 0.58;

  vec3 col = uBaseColor * (uAmbient + (1.0 - uAmbient) * shade);
  col = mix(col, col * uLightColor, 0.1 * shade);

  float glow = smoothstep(0.68, 0.96, ndl);
  col += uLightColor * glow * uHighlight;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 0.88);

  // 대기 원근 — 멀수록 안개색으로 밝게 녹음
  float fog = smoothstep(uFogNear * 0.85, uFogFar, vFogDepth);
  fog = pow(fog, 0.9);
  col = mix(col, uFogColor, fog);

  float atmo = smoothstep(uFogNear, uFogFar * 0.92, vFogDepth);
  col = mix(col, mix(uFogColor, col, 0.45), atmo * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
