// ─────────────────────────────────────────────────────────────
// toon.frag ─ 셀(카툰) 셰이딩 + 공기원근 안개
// 라이트와의 각도를 몇 단계로 "계단화"해서 평평한 손그림 음영을 만든다.
// ─────────────────────────────────────────────────────────────

uniform vec3 uBaseColor;
uniform vec3 uLightDir;   // 월드 공간 광원 방향(정규화 전제)
uniform vec3 uLightColor;
uniform float uAmbient;   // 0~1, 클수록 그림자가 옅어 평평해진다
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vNormalW;
varying float vFogDepth;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uLightDir);

  // 0~1로 매핑한 난반사
  float ndl = dot(N, L) * 0.5 + 0.5;

  // ── 셀 밴드(3단계) ── 부드러운 그라데이션 대신 계단형 음영
  float band = ndl > 0.62 ? 1.0 : (ndl > 0.42 ? 0.8 : 0.62);

  vec3 col = uBaseColor * (uAmbient + (1.0 - uAmbient) * band);
  // 밝은 면에 햇빛색을 살짝 섞어 따뜻하게
  col *= mix(vec3(1.0), uLightColor, 0.22 * band);

  // ── 공기원근 ── 멀수록 안개색으로 수렴
  float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
  col = mix(col, uFogColor, fog);

  gl_FragColor = vec4(col, 1.0);
}
