jest.mock(
  '../../platforms/react-native/transport/native/NativeUsbSerialTransport',
);
import React from 'react';
import { Linking, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import '../../i18n';
import i18n from '../../i18n';
import StartScreen from './StartScreen';
import { MAIN_TABS } from '../../navigation/tabs';

it('removes donation controls while keeping all tools and public destinations discoverable', () => {
  const navigate = jest.fn();
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <StartScreen navigation={{ navigate } as never} route={{} as never} />,
    );
  });
  const text = renderer.root
    .findAllByType(Text)
    .map(node => String(node.props.children))
    .join(' ');
  expect(text).not.toMatch(/ko-fi|doneer|donatie|ondersteun het project/i);
  expect(
    renderer.root.findAllByProps({ testID: 'start-support' }),
  ).toHaveLength(0);
  expect(
    renderer.root.findAllByProps({ testID: 'start-support-kofi' }),
  ).toHaveLength(0);
  for (const tab of MAIN_TABS.filter(item => item.implemented)) {
    expect(text).toContain(i18n.t(tab.labelKey));
    expect(
      renderer.root.findAllByProps({ testID: `tool-directory-${tab.key}` })
        .length,
    ).toBeGreaterThan(0);
  }
  for (const [id, route] of [
    ['start-firmware', 'FirmwareFlasher'],
    ['start-flight-style-guide', 'FlightStyleGuide'],
  ]) {
    const control = renderer.root
      .findAllByProps({ testID: id })
      .find(node => typeof node.props.onPress === 'function');
    act(() => {
      control!.props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith(route);
  }
  expect(openURL).not.toHaveBeenCalled();
  act(() => renderer.unmount());
  openURL.mockRestore();
});
