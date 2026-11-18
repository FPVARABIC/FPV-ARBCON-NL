import {appearanceFor, effectiveOpacity} from './orientationAppearance';

describe('shared 3D materials', () => {
  it.each(['PROP_RING_FRONT', 'PROP_RING_REAR'] as const)('%s is an outline so it cannot obscure the airframe', material => {
    expect(appearanceFor(material)).toMatchObject({filled: false, outlined: true});
  });
  it('keeps swept discs subordinate to the static blades and front distinct from rear', () => {
    expect(appearanceFor('PROP_DISC_FRONT').baseOpacity).toBeLessThan(0.15);
    expect(appearanceFor('PROP_BLADE_FRONT').baseOpacity).toBe(1);
    expect(appearanceFor('PROP_BLADE_FRONT').color).not.toBe(appearanceFor('PROP_BLADE_REAR').color);
  });
  it('dims every material when a genuine pose becomes stale without making it disappear', () => {
    const disc = appearanceFor('PROP_DISC_FRONT');
    expect(effectiveOpacity(disc.baseOpacity, false)).toBe(disc.baseOpacity);
    expect(effectiveOpacity(disc.baseOpacity, true)).toBeGreaterThan(0);
    expect(effectiveOpacity(disc.baseOpacity, true)).toBeLessThan(disc.baseOpacity);
  });
});
