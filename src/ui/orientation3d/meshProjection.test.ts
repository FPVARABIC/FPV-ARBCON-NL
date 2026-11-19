import {
  meshForAirframe,
  projectAirframeMesh,
  projectMeshPoint,
} from './meshProjection';
import { sceneAirframeFor } from './airframeSceneModel';
const observed = (mixerModeRaw: number, motorCount: number) =>
  sceneAirframeFor({ mixerModeRaw, motorCount, sessionId: 'mesh-test' });
describe('actual aircraft geometry through the verified mixer gate', () => {
  it('never substitutes a quad for missing, custom or contradictory evidence', () => {
    for (const frame of [
      undefined,
      observed(255, 4),
      observed(6, 4),
      observed(3, 6),
    ])
      expect(meshForAirframe(frame)).toBeUndefined();
  });
  it.each([
    [1, 3],
    [3, 4],
    [6, 6],
    [7, 6],
    [9, 4],
    [10, 6],
    [14, 1],
    [17, 4],
    [22, 4],
  ])(
    'projects the actual imported model for mixer %i without invalid geometry',
    (mode, count) => {
      const frame = observed(mode, count),
        mesh = meshForAirframe(frame);
      expect(mesh).toBeDefined();
      expect(mesh!.triangles.length).toBeGreaterThan(300);
      for (const pose of [
        { rollDeg: 0, pitchDeg: 0, yawDeg: 0 },
        { rollDeg: 37, pitchDeg: -24, yawDeg: 271 },
      ]) {
        const faces = projectAirframeMesh(mesh!, pose, 640, 350);
        expect(faces).toHaveLength(mesh!.triangles.length);
        for (const f of faces) {
          expect(f.color).toMatch(/^#[0-9a-f]{6}$/i);
          for (const p of f.points) {
            expect(
              Number.isFinite(p.x) && Number.isFinite(p.y) && p.depth > 0,
            ).toBe(true);
            expect(p.x).toBeGreaterThan(0);
            expect(p.x).toBeLessThan(640);
            expect(p.y).toBeGreaterThan(0);
            expect(p.y).toBeLessThan(350);
          }
        }
      }
    },
  );
  it('preserves plus and coaxial octo topology using authored geometry rather than a quad asset', () => {
    const plus = meshForAirframe(observed(2, 4)),
      octo = meshForAirframe(observed(11, 8));
    expect(plus?.source).toBe('fiercon-authored-topology');
    expect(octo?.source).toBe('fiercon-authored-topology');
    expect(octo!.triangles.length).toBeGreaterThan(plus!.triangles.length);
  });
  it('keeps the camera centered and body-right on screen-right', () => {
    expect(projectMeshPoint({ x: 0, y: 0, z: 0 }, 640, 350)).toMatchObject({
      x: 320,
      y: 175,
    });
    expect(projectMeshPoint({ x: 0, y: 0, z: 1 }, 640, 350).x).toBeGreaterThan(
      320,
    );
  });
});
