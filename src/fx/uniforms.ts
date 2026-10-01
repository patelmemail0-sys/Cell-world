import * as THREE from 'three';

// Uniforms shared by every custom shader. Updated once per frame by the engine.
export const globalUniforms = {
  uTime: { value: 0 },          // real seconds (membrane undulation, shimmer)
  uProcessTime: { value: 0 },   // scaled, pausable process clock
  uMotion: { value: 1 },        // 0 when reduced motion is on
  uFogColor: { value: new THREE.Color(0x041620) },
  uFogDensity: { value: 0.019 },
};
