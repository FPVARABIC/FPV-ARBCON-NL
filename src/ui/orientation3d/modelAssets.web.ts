/** Model meshes from Betaflight 568ac79, GPL-3.0-or-later.
 * Airplane: Low-Poly Biplane by lord_syrup, CC-BY-4.0; see models/airplane.license.txt.
 * Vite owns the public base path; there are no remote model downloads. */
import quad from './models/quad_x.gltf?url';
import tri from './models/tricopter.gltf?url';
import y6 from './models/y6.gltf?url';
import y4 from './models/y4.gltf?url';
import hexPlus from './models/hex_plus.gltf?url';
import hexX from './models/hex_x.gltf?url';
import aTail from './models/quad_atail.gltf?url';
import vTail from './models/quad_vtail.gltf?url';
import plane from './models/airplane.gltf?url';
import type { DroneSceneAirframe } from './droneSceneGeometry';
export const MODEL_ASSETS: Readonly<Record<number, string>> = {
  1: tri,
  3: quad,
  6: y6,
  7: hexPlus,
  9: y4,
  10: hexX,
  14: plane,
  17: vTail,
  22: aTail,
  26: quad,
};
export function modelAssetFor(
  airframe: DroneSceneAirframe | undefined,
): string | undefined {
  if (airframe?.mixerModeRaw === undefined) return undefined;
  // The shared airframe gate has already proved both mixer and runtime count.
  // No model is inferred from a motor count alone, and unsupported frames stay explicit.
  return MODEL_ASSETS[airframe.mixerModeRaw];
}
