import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { digitState, digitStyleMap, OtpInput } from '../components/OtpInput';
import { OTP_LENGTH } from '../otp';
import { colors } from '../theme';

const empty = () => Array(OTP_LENGTH).fill('');

test('digitState maps filled, focused, and empty', () => {
  expect(digitState('4', true)).toBe('filled');
  expect(digitState('4', false)).toBe('filled');
  expect(digitState('', true)).toBe('focused');
  expect(digitState('', false)).toBe('empty');
});

test('digitStyleMap covers all three digit states', () => {
  const map = digitStyleMap(colors.light);
  expect(Object.keys(map).sort()).toEqual(['empty', 'filled', 'focused']);
  expect(map.filled.backgroundColor).toBe(colors.light.digitFilledBg);
  expect(map.focused.borderColor).toBe(colors.light.digitFocusedOutline);
  expect(map.empty.backgroundColor).toBe(colors.light.digitEmptyBg);
});

test('OtpInput renders six labelled digit boxes with clear props', async () => {
  const onChangeText = jest.fn();
  const onKeyPress = jest.fn();
  const onFocusIndex = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <OtpInput
        digits={['1', '2', '', '', '', '']}
        focusIndex={2}
        colors={colors.light}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocusIndex={onFocusIndex}
      />,
    );
  });
  const boxes = renderer!.root.findAll(
    node =>
      typeof node.props.testID === 'string' &&
      /^otp_digit_\d$/.test(node.props.testID) &&
      node.props.keyboardType === 'number-pad',
  );
  const byId = [...new Map(boxes.map(b => [b.props.testID, b])).values()];
  expect(byId).toHaveLength(6);
  expect(byId.map(b => b.props.accessibilityLabel)).toEqual(
    [1, 2, 3, 4, 5, 6].map(n => `Digit ${n} of 6`),
  );
  expect(byId[0].props.value).toBe('1');
  expect(byId[2].props.placeholder).toBe('');
  expect(byId[3].props.placeholder).toBe('\u2013');
  await ReactTestRenderer.act(() => {
    byId[2].props.onChangeText('9');
  });
  expect(onChangeText).toHaveBeenCalledWith(2, '9');
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('OtpInput starts from empty digits when asked', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <OtpInput
        digits={empty()}
        focusIndex={0}
        colors={colors.dark}
        onChangeText={() => {}}
        onKeyPress={() => {}}
        onFocusIndex={() => {}}
      />,
    );
  });
  const first = renderer!.root.findAll(n => n.props.testID === 'otp_digit_1')[0];
  expect(first.props.autoFocus).toBe(true);
  expect(first.props.value).toBe('');
  await ReactTestRenderer.act(() => renderer!.unmount());
});
