/**
 * Layer fragment shader.
 *
 * When uHasMap == 1 the PNG texture is sampled and its alpha drives
 * transparency (pixels below 0.01 are discarded, preserving ink edges).
 * When uHasMap == 0 the solid uColor is used as a placeholder, with a
 * top-edge fade (uFadeY) so back layers show through — looks like a
 * coloured silhouette band until real PNGs replace it.
 *
 * uFogAmount blends the layer toward uFogColor (aerial perspective).
 */
const LAYER_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float     uHasMap;
  uniform vec3      uColor;
  uniform float     uFogAmount;
  uniform vec3      uFogColor;
  // Placeholder-only: UV-Y at which the solid colour fades to transparent.
  // 1.0 = fully opaque across whole plane; 0.5 = solid in bottom half only.
  uniform float     uFadeY;
  // Cover-fit: image vs plane aspect so PNGs fill the frame without stretch.
  uniform float     uImgAspect;
  uniform float     uPlaneAspect;
  // Vertical crop bias for cover-fit: +ve keeps the TOP of the image
  // (e.g. sky / sun) in frame, cropping more of the bottom.
  uniform float     uCropBias;
  // Depth band (in SCREEN vUv.y, 0=bottom .. 1=top). Only this horizontal
  // slice of the frame is drawn, with a feathered edge so neighbouring
  // bands overlap seamlessly. uBandMax >= 1.5 disables banding (full frame).
  uniform float     uBandMin;
  uniform float     uBandMax;
  uniform float     uBandFeather;
  varying vec2      vUv;

  void main() {
    vec4 samp;
    float bandA = 1.0;

    if (uHasMap > 0.5) {
      // CSS "background-size: cover" — scale the smaller axis, crop overflow.
      vec2 uv = vUv;
      if (uImgAspect > 0.0) {
        if (uImgAspect > uPlaneAspect) {
          // image wider than plane → fill height, crop sides
          uv.x = (uv.x - 0.5) * (uPlaneAspect / uImgAspect) + 0.5;
        } else {
          // image taller than plane → fill width, crop top/bottom
          uv.y = (uv.y - 0.5) * (uImgAspect / uPlaneAspect) + 0.5 + uCropBias;
        }
      }
      samp = texture2D(uMap, uv);
      if (samp.a < 0.01) discard;

      // Depth-band mask (screen-space). Feathered top & bottom edges.
      if (uBandMax < 1.5) {
        float lo = smoothstep(uBandMin, uBandMin + uBandFeather, vUv.y);
        float hi = 1.0 - smoothstep(uBandMax - uBandFeather, uBandMax, vUv.y);
        bandA = lo * hi;
        if (bandA < 0.004) discard;
      }
    } else {
      // vUv.y: 0 = bottom, 1 = top (Three.js default PlaneGeometry)
      float fade = 1.0 - smoothstep(uFadeY - 0.12, uFadeY, vUv.y);
      samp = vec4(uColor, fade);
      if (fade < 0.01) discard;
    }

    vec3 col = mix(samp.rgb, uFogColor, uFogAmount);
    gl_FragColor = vec4(col, samp.a * bandA);
  }
`

export default LAYER_FRAG
