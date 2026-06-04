/**
 * Shared mutable pointer state — updated every frame by CameraRig,
 * read every frame by each ParallaxLayer. Using a plain object (not Zustand)
 * avoids React re-renders on every animation frame while keeping a single
 * source of truth that all components share.
 */
export const smoothPointer = { x: 0, y: 0 }
