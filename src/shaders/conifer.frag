// ─────────────────────────────────────────────────────────────
// conifer.frag — 레퍼런스 침엽: 라임 하이라이트 → 짙은 녹색 그라데이션
// ─────────────────────────────────────────────────────────────

uniform vec3 uColorTop;
uniform vec3 uColorBottom;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uHighlight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vNormalW;
varying float vFogDepth;
varying float vHeight;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);

  float ndl = dot(N, L) * 0.5 + 0.5;

  // 층 안에서 위쪽·밝은 면일수록 라임
  float vert = pow(vHeight, 0.72);
  vec3 base = mix(uColorBottom, uColorTop, vert);

  float shade = smoothstep(0.25, 0.55, ndl) * 0.18 + smoothstep(0.48, 0.88, ndl) * 0.28 + 0.52;
  vec3 col = base * (uAmbient + (1.0 - uAmbient) * shade);
  col = mix(col, col * uLightColor, 0.14 * shade);

  // 우상단 빛 (레퍼런스)
  float rim = smoothstep(0.55, 0.95, ndl) * smoothstep(0.35, 0.95, vHeight);
  col += uColorTop * rim * uHighlight * 1.4;

  float fog = smoothstep(uFogNear * 0.85, uFogFar, vFogDepth);
  fog = pow(fog, 0.9);
  col = mix(col, uFogColor, fog);

  float atmo = smoothstep(uFogNear, uFogFar * 0.92, vFogDepth);
  col = mix(col, mix(uFogColor, col, 0.45), atmo * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
