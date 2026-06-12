// ─────────────────────────────────────────────────────────────
// treeModel.frag — 바닥 톤에 맞춘 나무 + 종류·위치별 색 변화
// ─────────────────────────────────────────────────────────────

#include ./lib/noise.glsl

uniform sampler2D uMap;
uniform float uHasMap;
uniform vec3 uTint;
uniform vec3 uColorTop;
uniform vec3 uColorBottom;
uniform vec3 uGroundTone;
uniform float uGroundMix;
uniform float uVariation;
uniform float uBrightness;
uniform float uSaturation;
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
varying vec2 vUv;
varying vec2 vWorldXZ;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);
  float ndl = dot(N, L) * 0.5 + 0.5;

  vec3 tex = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uColorBottom;
  tex = max(tex, vec3(0.08));
  tex *= uBrightness;

  // 위치별 얼룩 — 같은 종류도 명도·채도가 조금씩 다르게
  float nPatch = valueNoise(vWorldXZ * 0.085 + vec2(2.4, 5.1));
  float nFine = valueNoise(vWorldXZ * 0.21 + vec2(9.2, 1.8));
  float var = (nPatch - 0.5) * uVariation + (nFine - 0.5) * uVariation * 0.4;

  vec3 base = mix(tex, tex * uTint, 0.38);
  float vert = pow(vHeight, 0.82);
  base = mix(base * uColorBottom, base * uColorTop, vert);
  base += vec3(var * 0.65);

  // 바닥(ground.frag)과 같은 음영·채도 밴드 — 파스텔용 대비 완화
  float shade = smoothstep(0.28, 0.52, ndl) * 0.14 + smoothstep(0.5, 0.82, ndl) * 0.18 + 0.62;
  vec3 col = base * (uAmbient + (1.0 - uAmbient) * shade);
  col = mix(col, col * uLightColor, 0.07 * shade);

  float rim = smoothstep(0.62, 0.92, ndl) * smoothstep(0.38, 0.9, vHeight);
  col += uColorTop * rim * uHighlight * 0.28;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uSaturation);

  // 파스텔 리프트 — 밝고 부드러운 톤
  col = mix(col, vec3(lum + 0.1), 0.14);
  col = mix(col, vec3(0.98, 0.96, 0.92), 0.1);

  // 잔디 바닥 톤으로 살짝 녹여 자연스럽게
  col = mix(col, uGroundTone, uGroundMix * (0.5 + nPatch * 0.38));

  float fog = smoothstep(uFogNear * 0.85, uFogFar, vFogDepth);
  fog = pow(fog, 0.9);
  col = mix(col, uFogColor, fog);

  float atmo = smoothstep(uFogNear, uFogFar * 0.92, vFogDepth);
  col = mix(col, mix(uFogColor, col, 0.45), atmo * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
