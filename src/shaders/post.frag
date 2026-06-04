// ─────────────────────────────────────────────────────────────
// post.frag ─ 종이 질감 포스트프로세싱
// 렌더된 씬 위에 종이 그레인 + 미세한 색 바램 + 비네팅을 얹어
// "손그림이 인쇄된 종이" 느낌을 만든다.
// ─────────────────────────────────────────────────────────────

#include ./lib/noise.glsl

uniform sampler2D uScene;        // 렌더된 씬 텍스처
uniform float uTime;             // 그레인 미세 흔들림
uniform vec2  uResolution;       // 화면 픽셀 크기
uniform float uGrain;            // 그레인 세기
uniform float uVignette;         // 비네팅 세기
uniform float uVignetteSoftness; // 비네팅 부드러움

varying vec2 vUv;

void main() {
  vec3 col = texture2D(uScene, vUv).rgb;

  // ── 종이 그레인 ──
  // 픽셀 좌표 기반 노이즈에 시간 흔들림을 살짝 줘서 종이 섬유 느낌
  vec2 grainUv = vUv * uResolution * 0.5;
  float n = valueNoise(grainUv + uTime * 0.5);
  col += (n - 0.5) * uGrain;

  // ── 비네팅 ──
  // 화면 중심에서 멀어질수록 어둡게
  float d = distance(vUv, vec2(0.5));
  float vig = smoothstep(0.8, uVignetteSoftness, d);
  col *= mix(1.0, vig, uVignette);

  gl_FragColor = vec4(col, 1.0);
}
