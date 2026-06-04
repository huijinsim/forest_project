// ─────────────────────────────────────────────────────────────
// toon.frag ─ 부드러운 일러스트형 음영 + 공기원근
// 날카로운 3단계 대신 smoothstep으로 채도 낮은 손그림 톤을 만든다.
// ─────────────────────────────────────────────────────────────

uniform vec3 uBaseColor;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vNormalW;
varying float vFogDepth;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);

  float ndl = dot(N, L) * 0.5 + 0.5;

  // 부드러운 2~3단 음영 (일러스트 스티플 느낌의 옅은 명암)
  float shade = smoothstep(0.28, 0.52, ndl) * 0.22 + smoothstep(0.5, 0.82, ndl) * 0.28 + 0.5;

  vec3 col = uBaseColor * (uAmbient + (1.0 - uAmbient) * shade);
  col = mix(col, col * uLightColor, 0.12 * shade);

  // 채도를 살짝 눌러 일러스트 톤 유지
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 0.88);

  float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
  col = mix(col, uFogColor, fog);

  gl_FragColor = vec4(col, 1.0);
}
