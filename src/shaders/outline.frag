// ─────────────────────────────────────────────────────────────
// outline.frag ─ 잉크 외곽선 색
// 멀어지면 안개색으로 페이드해서 먼 나무의 테두리가 흐려지게 한다.
// ─────────────────────────────────────────────────────────────

uniform vec3 uInk;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying float vFogDepth;

void main() {
  float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
  vec3 col = mix(uInk, uFogColor, fog);
  gl_FragColor = vec4(col, 1.0);
}
