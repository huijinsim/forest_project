// Fullscreen procedural illustration forest — NO geometry modelling.
// Everything (sky, mountains, layered trees, ground, ink outlines, hatching)
// is drawn in this fragment shader. Depth comes from stacked
// layers: receding baselines, shrinking canopies, aerial-haze fog and
// pointer parallax (near layers shift more than far ones).

export const FOREST_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fill the screen regardless of camera — this is a 2D shader canvas.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const FOREST_FRAG = /* glsl */ `
  precision highp float;

  uniform vec2  uResolution;
  uniform float uTime;
  uniform vec2  uMouse;     // smoothed, -1..1
  varying vec2  vUv;

  // ── palette ────────────────────────────────────────────────────────────────
  const vec3 SKY_TOP = vec3(0.80, 0.85, 0.57);
  const vec3 SKY_HOR = vec3(0.98, 0.87, 0.52);
  const vec3 GRASS_N = vec3(0.60, 0.68, 0.34);
  const vec3 GRASS_F = vec3(0.74, 0.79, 0.52);
  const vec3 FOGC    = vec3(0.87, 0.89, 0.68);
  const vec3 INK     = vec3(0.09, 0.12, 0.07);

  float hash11(float p){ return fract(sin(p * 127.1) * 43758.5453); }
  float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1,0)), u.x),
               mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<4;i++){ v += a*vnoise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  float pineField(vec2 p, vec2 root, float h, float w, float seed){
    vec2 d = p - root;
    float y = clamp(d.y / h, 0.0, 1.0);
    float tiers = 0.64 + 0.26 * sin(y * 38.0 + seed * 4.4)
                + 0.13 * sin(y * 81.0 - seed * 2.7);
    float taper = pow(1.0 - y, 0.60);
    float width = w * taper * tiers;
    float edgeWave = sin(d.y * 44.0 + seed) * w * 0.12
                   + sin(d.y * 91.0 - seed * 0.7) * w * 0.06;
    float jag = (fbm(vec2(d.x * 46.0 + seed, d.y * 26.0)) - 0.5) * w * 0.45;
    float side = width - abs(d.x + jag);
    side += edgeWave * (1.0 - y);
    float vertical = min(d.y, h - d.y);
    return min(side, vertical);
  }

  float forestRidge(float x, float baseY, float height, float spacing, float seed){
    float ridge = baseY + height * 0.36;
    for(int k=-2;k<=2;k++){
      float cell = floor(x / spacing) + float(k);
      float h1 = hash11(cell * 1.7 + seed);
      float h2 = hash11(cell * 3.9 + seed + 13.0);
      float cx = cell * spacing + (h1 - 0.5) * spacing * 0.55;
      float local = 1.0 - abs(x - cx) / (spacing * (0.22 + h2 * 0.16));
      local = max(local, 0.0);
      float tip = baseY + height * (0.56 + h2 * 0.48) * pow(local, 0.38);
      ridge = max(ridge, tip);
    }
    ridge += (fbm(vec2(x * 6.0 + seed, seed)) - 0.5) * height * 0.18;
    return ridge;
  }

  // One stacked shader-drawn forest layer. It is not geometry: it is a 2D
  // signed field made from pine silhouettes, ridge height and ink strokes.
  vec4 forestLayer(vec2 p, float baseY, float height, float spacing,
                   vec3 base, float fog, float parallax, float seed, float detail){
    p.x += parallax * uMouse.x;
    p.y += parallax * uMouse.y * 0.35;

    float ridge = forestRidge(p.x, baseY, height, spacing, seed);
    float baseLine = baseY + (fbm(vec2(p.x * 9.0 + seed, seed)) - 0.5) * height * 0.07;
    float field = min(p.y - baseLine, ridge - p.y);

    float pine = -1e9;
    float cx = 0.0, treeH = height, treeW = spacing * 0.26;
    for(int k=-2;k<=2;k++){
      float cell = floor(p.x / spacing) + float(k);
      float h1 = hash11(cell * 1.7 + seed);
      float h2 = hash11(cell * 3.3 + seed + 11.0);
      float jx = (h1 - 0.5) * spacing * 0.54;
      float th = height * (0.78 + h2 * 0.52);
      float tw = spacing * (0.055 + h1 * 0.055);
      float by = baseY + (hash11(cell * 5.1 + seed) - 0.5) * height * 0.06;
      vec2 root = vec2(cell * spacing + jx, by);
      float f = pineField(p, root, th, tw, cell + seed);
      if(f > pine){ pine = f; cx = root.x; treeH = th; treeW = tw; }
    }
    field = max(field, pine);

    // clamp derivative-based AA so cell-boundary discontinuities don't spike
    // into stray smear lines across the frame
    float aa = clamp(fwidth(field), 0.0006, 0.006);
    float fill = smoothstep(-aa, aa, field);

    float trunkW = max(treeW * 0.20, 0.0024);
    float taa = clamp(fwidth(p.x - cx), 0.0006, 0.004);
    float trunkCol_m = (1.0 - smoothstep(trunkW - taa, trunkW + taa, abs(p.x - cx)))
                     * step(baseY, p.y) * step(p.y, baseY + treeH * 0.66)
                     * fill * detail;

    float cov = max(fill, trunkCol_m);
    if(cov < 0.003) return vec4(0.0);

    float grad = clamp((p.y - baseY) / max(height * 1.35, 1e-3), 0.0, 1.0);
    vec3 col = base * mix(0.68, 1.08, smoothstep(0.02, 1.0, grad));

    // trunk colour
    vec3 trunkCol = mix(vec3(0.32,0.30,0.22), vec3(0.50,0.46,0.36), hash11(cx));
    col = mix(col, trunkCol, trunkCol_m * 0.34);

    // needle/branch strokes: diagonal pen marks, visible mostly on near layers.
    float branch = sin((p.x - cx) * 115.0 + p.y * 175.0 + seed);
    float hatch = smoothstep(0.78, 1.0, branch) * smoothstep(0.70, 0.0, grad) * fill * detail;
    col = mix(col, INK, hatch * 0.18);

    // ink outline: ridge and pine edges, not round leaf blobs.
    float lineW = max(spacing * 0.026, 0.0025);
    float ink = (1.0 - smoothstep(lineW - aa, lineW + aa, field)) * fill;
    float trunkEdge = (1.0 - smoothstep(trunkW - taa, trunkW + taa, abs(p.x - cx)))
                    - (1.0 - smoothstep(trunkW*0.55 - taa, trunkW*0.55 + taa, abs(p.x - cx)));
    ink = max(ink, clamp(trunkEdge, 0.0, 1.0) * trunkCol_m * detail);
    col = mix(col, INK, clamp(ink, 0.0, 1.0) * 0.92);

    // aerial haze
    col = mix(col, FOGC, fog);

    return vec4(col, cov);
  }

  // Rounded procedural mountains far behind the trees.
  vec3 mountains(vec3 bg, vec2 p){
    float band = 0.0;
    vec3 col = bg;
    for(int m=0;m<2;m++){
      float fm = float(m);
      float baseY = 0.56 + fm * 0.05;
      float amp   = 0.22 - fm * 0.06;
      float px = p.x + (0.02 + fm*0.02) * uMouse.x;
      float ridge = baseY
        + amp * (0.5 + 0.5*sin(px*2.1 + fm*2.0))
        + amp * 0.4 * fbm(vec2(px*3.0 + fm*5.0, 0.0));
      float aa = fwidth(ridge) + 1e-4;
      float inside = smoothstep(aa, -aa, p.y - ridge);
      vec3 mc = mix(vec3(0.72,0.76,0.62), vec3(0.80,0.83,0.70), fm);
      mc = mix(mc, FOGC, 0.35 + fm*0.2);
      // ridge ink line
      float line = (1.0 - smoothstep(0.0, 0.004, abs(p.y - ridge)));
      mc = mix(mc, INK, line * 0.5);
      col = mix(col, mc, inside);
    }
    return col;
  }

  void main(){
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y);

    // ── sky / ground background ──────────────────────────────────────────────
    float horizon = 0.52;
    vec3 sky = mix(SKY_HOR, SKY_TOP, smoothstep(horizon, 1.0, vUv.y));
    // sun — clean inked disc
    vec2 sunP = vec2(0.32 * aspect, 0.82);
    float sd = distance(p, sunP);
    float sunFill = smoothstep(0.052, 0.048, sd);
    float sunRing = smoothstep(0.058, 0.054, sd) * (1.0 - smoothstep(0.052, 0.048, sd));
    sky = mix(sky, vec3(0.99,0.87,0.56), sunFill);
    sky = mix(sky, INK, sunRing * 0.7);
    // soft procedural clouds (kept in the sky band only)
    float cloudMask = smoothstep(horizon + 0.05, 0.95, vUv.y);
    float cl = smoothstep(0.58, 0.86, fbm(vec2(p.x * 1.6 + uTime * 0.01, vUv.y * 3.0)));
    sky = mix(sky, vec3(0.97,0.95,0.86), cl * cloudMask * 0.55);

    float gDepth = smoothstep(horizon, 0.0, vUv.y);  // 1 near bottom
    vec3 ground = mix(GRASS_F, GRASS_N, gDepth);
    // grass speckle marks
    float marks = step(0.93, hash21(floor(p*vec2(90.0,120.0))));
    ground = mix(ground, INK, marks * gDepth * 0.18);

    vec3 col = vUv.y > horizon ? sky : ground;

    // ── mountains ──────────────────────────────────────────────────────────────
    col = mountains(col, p);

    // ── stacked forest layers, far → near (this is the depth / 공간감) ─────────
    vec4 L;
    L = forestLayer(p, 0.500, 0.125, 0.055, vec3(0.58,0.65,0.42), 0.56, 0.014, 1.0, 0.10); col = mix(col, L.rgb, L.a);
    L = forestLayer(p, 0.455, 0.170, 0.070, vec3(0.53,0.62,0.37), 0.42, 0.030, 7.0, 0.25); col = mix(col, L.rgb, L.a);
    L = forestLayer(p, 0.380, 0.235, 0.090, vec3(0.47,0.58,0.33), 0.27, 0.055, 3.0, 0.45); col = mix(col, L.rgb, L.a);
    L = forestLayer(p, 0.275, 0.330, 0.115, vec3(0.40,0.52,0.29), 0.13, 0.090, 13.0, 0.72); col = mix(col, L.rgb, L.a);
    L = forestLayer(p, 0.110, 0.480, 0.145, vec3(0.32,0.44,0.24), 0.02, 0.145, 21.0, 1.00); col = mix(col, L.rgb, L.a);

    // subtle edge falloff only; no paper-texture overlay
    float vig = smoothstep(1.25, 0.32, distance(vUv, vec2(0.5)));
    col *= mix(0.96, 1.0, vig);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`
