// ─────────────────────────────────────────────────────────────
// ground.vert — 바닥 (월드 XZ를 프래그먼트로 전달)
// ─────────────────────────────────────────────────────────────

varying vec3 vNormalW;
varying float vFogDepth;
varying vec2 vWorldXZ;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldXZ = worldPos.xz;
  vNormalW = normalize(mat3(modelMatrix) * normal);

  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mvPos.z;
  gl_Position = projectionMatrix * mvPos;
}
