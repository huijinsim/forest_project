// ─────────────────────────────────────────────────────────────
// post.frag — 몽환적 포스트 (블룸 + 골든아워 + 종이 질감)
// ─────────────────────────────────────────────────────────────

#include ./lib/noise.glsl

uniform sampler2D uScene;
uniform float uTime;
uniform vec2  uResolution;
uniform float uGrain;
uniform float uVignette;
uniform float uVignetteSoftness;

uniform float uBloomThreshold;
uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uWarmTint;
uniform vec3  uWarmColor;
uniform float uLift;
uniform float uHaze;
uniform float uSaturation;

varying vec2 vUv;

vec3 sampleScene(vec2 uv) {
  return texture2D(uScene, uv).rgb;
}

// 밝은 영역만 흐리게 모아 블룸
vec3 bloomPass(vec2 uv) {
  vec2 px = uBloomRadius / uResolution;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;

  for (int x = -3; x <= 3; x++) {
    for (int y = -3; y <= 3; y++) {
      vec2 off = vec2(float(x), float(y)) * px;
      vec3 s = sampleScene(uv + off);
      float l = dot(s, vec3(0.299, 0.587, 0.114));
      float b = max(l - uBloomThreshold, 0.0);
      float w = 1.0 - length(vec2(float(x), float(y))) / 4.2;
      w = max(w, 0.0);
      acc += s * b * w;
      wsum += w;
    }
  }
  return acc / max(wsum, 0.001);
}

void main() {
  vec3 col = sampleScene(vUv);

  // ── 골든아워 색감 ──
  col = mix(col, col * uWarmColor, uWarmTint);
  col += uLift;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uSaturation);

  // ── 블룸 (몽환적 글로우) ──
  col += bloomPass(vUv) * uBloomStrength;

  // ── 지평선 헤이즈 (하단 따뜻한 안개) ──
  float hazeMask = smoothstep(0.55, 0.08, vUv.y);
  col = mix(col, col + vec3(0.08, 0.04, 0.02), hazeMask * uHaze);

  // ── 종이 그레인 ──
  vec2 grainUv = vUv * uResolution * 0.5;
  float n = valueNoise(grainUv + uTime * 0.35);
  col += (n - 0.5) * uGrain;

  // ── 부드러운 비네팅 ──
  float d = distance(vUv, vec2(0.5));
  float vig = smoothstep(0.85, uVignetteSoftness, d);
  col *= mix(1.0, vig, uVignette);

  gl_FragColor = vec4(col, 1.0);
}
