import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { OfflinePositionMap } from './OfflinePositionMap';
function mount(props: { latitude?: number; longitude?: number }) {
  let r!: ReactTestRenderer;
  act(() => {
    r = create(<OfflinePositionMap {...props} />);
  });
  return r;
}
function marker(r: ReactTestRenderer) {
  return r.root.findAllByProps({ testID: 'gps-map-position' });
}
describe('offline map position truth', () => {
  it.each([
    {},
    { latitude: 52 },
    { latitude: NaN, longitude: 5 },
    { latitude: 91, longitude: 5 },
    { latitude: 52, longitude: 181 },
  ])('does not invent a position for invalid evidence %j', p => {
    const r = mount(p);
    expect(marker(r)).toHaveLength(0);
    act(() => r.unmount());
  });
  it('shows a genuine zero coordinate and withdraws it when the fresh fix is withdrawn', () => {
    const r = mount({ latitude: 0, longitude: 0 });
    expect(marker(r).length).toBeGreaterThan(0);
    expect(marker(r)[0].props.cx).toBe(180);
    expect(marker(r)[0].props.cy).toBe(90);
    act(() => r.update(<OfflinePositionMap />));
    expect(marker(r)).toHaveLength(0);
    act(() => r.unmount());
  });
  it('zooms locally without altering the position', () => {
    const r = mount({ latitude: 52, longitude: 5 });
    const svg = () => r.root.findAllByProps({ testID: 'gps-map-svg' })[0];
    const before = svg().props.viewBox;
    const button = r.root
      .findAllByProps({ testID: 'gps-map-zoom-in' })
      .find(n => typeof n.props.onPress === 'function');
    act(() => button!.props.onPress());
    expect(svg().props.viewBox).not.toBe(before);
    expect(marker(r)[0].props.cx).toBe(185);
    expect(marker(r)[0].props.cy).toBe(38);
    act(() => r.unmount());
  });
});
