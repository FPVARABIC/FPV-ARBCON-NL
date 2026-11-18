import React from 'react';
import { Modal } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import '../../../i18n';
import BottomTabBar from './BottomTabBar';
import { MAIN_TABS } from '../../../navigation/tabs';

it('exposes every destination through the phone directory and forwards selection to the existing shell gate', () => {
  const onSelect = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <BottomTabBar activeTab="SETUP" onSelectTab={onSelect} />,
    );
  });
  const press = (id: string) => {
    const node = renderer.root
      .findAllByProps({ testID: id })
      .find(item => typeof item.props.onPress === 'function');
    if (!node) throw new Error('Missing control ' + id);
    act(() => node.props.onPress());
  };
  for (const tab of MAIN_TABS.filter(item => item.implemented)) {
    press('main-all-tools');
    expect(renderer.root.findByType(Modal).props.visible).toBe(true);
    press(`tool-select-${tab.key}`);
    expect(onSelect).toHaveBeenLastCalledWith(tab.key);
    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
  }
  expect(onSelect).toHaveBeenCalledTimes(
    MAIN_TABS.filter(item => item.implemented).length,
  );
  press('main-all-tools');
  press('main-tools-close');
  expect(renderer.root.findByType(Modal).props.visible).toBe(false);
  act(() => renderer.unmount());
});
