// ─────────────────────────────────────────────────────────────
// ground.frag — 잔디·흙 질감 (프로시저럴 패치)
// ─────────────────────────────────────────────────────────────

#include ./lib/noise.glsl

uniform vec3 uBaseColor;
uniform vec3 uPatchLight;
uniform vec3 uPatchDark;
uniform vec3 uDirtColor;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vNormalW;
varying float vFogDepth;
varying vec2 vWorldXZ;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);
  float ndl = dot(N, L) * 0.5 + 0.5;
  float shade = smoothstep(0.28, 0.52, ndl) * 0.22 + smoothstep(0.5, 0.82, ndl) * 0.28 + 0.5;

  // 큰 잔디 덩어리 + 작은 얼룩 + 흙 패치
  float nLarge = valueNoise(vWorldXZ * 0.045);
  float nMed = valueNoise(vWorldXZ * 0.11 + vec2(2.1, 5.7));
  float nFine = valueNoise(vWorldXZ * 0.28 + vec2(9.3, 1.2));
  float nDirt = valueNoise(vWorldXZ * 0.065 + vec2(14.0, 3.4));

  float lightPatch = smoothstep(0.42, 0.72, nLarge) * smoothstep(0.3, 0.8, nMed);
  float darkPatch = smoothstep(0.58, 0.82, nMed) * (1.0 - lightPatch);
  float dirt = smoothstep(0.68, 0.9, nDirt) * 0.42;
  float grain = (nFine - 0.5) * 0.08;

  vec3 col = uBaseColor;
  col = mix(col, uPatchLight, lightPatch * 0.38);
  col = mix(col, uPatchDark, darkPatch * 0.32);
  col = mix(col, uDirtColor, dirt);
  col += grain;

  col *= uAmbient + (1.0 - uAmbient) * shade;
  col = mix(col, col * uLightColor, 0.1 * shade);

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 0.86);

  float fog = smoothstep(uFogNear * 0.85, uFogFar, vFogDepth);
  fog = pow(fog, 0.9);
  col = mix(col, uFogColor, fog);

  gl_FragColor = vec4(col, 1.0);
}
