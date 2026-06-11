// ─────────────────────────────────────────────────────────────
// treeModel.frag — GLB 텍스처 + 숲 톤 툰 셰이딩
// ─────────────────────────────────────────────────────────────

uniform sampler2D uMap;
uniform float uHasMap;
uniform vec3 uTint;
uniform vec3 uColorTop;
uniform vec3 uColorBottom;
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

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);
  float ndl = dot(N, L) * 0.5 + 0.5;

  vec3 tex = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uColorBottom;
  tex = max(tex, vec3(0.06));
  tex *= uBrightness;

  // Meshy 원본을 숲 팔레트에 맞게 틴트
  vec3 base = mix(tex, tex * uTint, 0.42);
  float vert = pow(vHeight, 0.68);
  base = mix(base * uColorBottom, base * uColorTop, vert);

  float shade = smoothstep(0.26, 0.5, ndl) * 0.18 + smoothstep(0.48, 0.84, ndl) * 0.24 + 0.56;
  vec3 col = base * (uAmbient + (1.0 - uAmbient) * shade);
  col = mix(col, col * uLightColor, 0.12 * shade);

  float rim = smoothstep(0.58, 0.94, ndl) * smoothstep(0.32, 0.92, vHeight);
  col += uColorTop * rim * uHighlight * 1.25;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uSaturation);

  float fog = smoothstep(uFogNear * 0.85, uFogFar, vFogDepth);
  fog = pow(fog, 0.9);
  col = mix(col, uFogColor, fog);

  float atmo = smoothstep(uFogNear, uFogFar * 0.92, vFogDepth);
  col = mix(col, mix(uFogColor, col, 0.45), atmo * 0.35);

  gl_FragColor = vec4(col, 1.0);
}
