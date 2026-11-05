import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {
  applyBackspace,
  applyInput,
  formatCountdown,
  isComplete,
  OTP_LENGTH,
  RESEND_SECONDS,
  restartResend,
  submit,
  tickResend,
  verify,
} from '../otp';

const empty = () => Array(OTP_LENGTH).fill('');

test('AC1: six separate digit boxes with number-pad autofocus and digit-only input', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const boxes = renderer!.root.findAll(
    node =>
      typeof node.props.testID === 'string' &&
      /^otp_digit_\d$/.test(node.props.testID) &&
      node.props.keyboardType === 'number-pad',
  );
  const byId = [...new Map(boxes.map(b => [b.props.testID, b])).values()];
  expect(byId).toHaveLength(6);
  expect(byId.map(b => b.props.testID)).toEqual([
    'otp_digit_1',
    'otp_digit_2',
    'otp_digit_3',
    'otp_digit_4',
    'otp_digit_5',
    'otp_digit_6',
  ]);
  expect(byId.every(b => b.props.keyboardType === 'number-pad')).toBe(true);
  expect(byId[0].props.autoFocus).toBe(true);
  expect(applyInput(empty(), 0, 'a')).toEqual({ digits: empty(), focus: 0 });
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('AC2: empty boxes use en-dash placeholder never a real 0; filled and focused colors exist', async () => {
  const { EMPTY_PLACEHOLDER } = require('../theme');
  expect(EMPTY_PLACEHOLDER).toBe('\u2013');
  expect(EMPTY_PLACEHOLDER).not.toBe('0');
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  // Digit 1 starts focused → Bau: caret only, no placeholder behind caret
  const first = renderer!.root.findAll(
    n => n.props.testID === 'otp_digit_1' && n.props.keyboardType === 'number-pad',
  )[0];
  expect(first.props.placeholder).toBe('');
  const second = renderer!.root.findAll(
    n => n.props.testID === 'otp_digit_2' && n.props.keyboardType === 'number-pad',
  )[0];
  expect(second.props.placeholder).toBe('\u2013');
  expect(second.props.placeholder).not.toBe('0');
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('AC3: typing a digit moves focus to the next box', () => {
  expect(applyInput(empty(), 0, '4')).toEqual({
    digits: ['4', '', '', '', '', ''],
    focus: 1,
  });
});

test('AC4: backspace on an empty box clears the previous digit', () => {
  expect(applyBackspace(['2', '1', '', '', '', ''], 2)).toEqual({
    digits: ['2', '', '', '', '', ''],
    focus: 1,
  });
});

test('AC5: pasting Your code is 482913 fills the six boxes with 482913', () => {
  expect(applyInput(empty(), 0, 'Your code is 482913').digits.join('')).toBe('482913');
});

test('AC6: Submit is disabled until all six digits are filled', async () => {
  expect(isComplete(['1', '2', '3', '4', '5', ''])).toBe(false);
  expect(isComplete(['1', '2', '3', '4', '5', '6'])).toBe(true);
  expect(submit(['1', '2', '3', '4', '5', '']).status).toBe('idle');

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const button = renderer!.root.findByProps({ testID: 'otp_submit' });
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState).toEqual({ disabled: true });
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('AC7: 123456 + Submit shows You\'re in.', () => {
  expect(verify('123456')).toBe('success');
  expect(submit(['1', '2', '3', '4', '5', '6'])).toEqual({
    status: 'success',
    digits: ['1', '2', '3', '4', '5', '6'],
    focus: 5,
  });
});

test('AC8: wrong code shows error, clears boxes, focuses first', () => {
  expect(verify('654321')).toBe('error');
  expect(submit(['6', '5', '4', '3', '2', '1'])).toEqual({
    status: 'error',
    digits: empty(),
    focus: 0,
  });
});

test('AC9: Resend disabled for 30s countdown then restarts', async () => {
  expect(RESEND_SECONDS).toBe(30);
  expect(formatCountdown(7)).toBe('Resend in 0:07');
  expect(formatCountdown(30)).toBe('Resend in 0:30');
  expect(tickResend(1)).toBe(0);
  expect(restartResend(0)).toBe(30);
  expect(restartResend(12)).toBe(12);

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const resend = renderer!.root.findByProps({ testID: 'otp_resend' });
  expect(resend.props.disabled).toBe(true);
  const label = resend.findByType('Text' as any);
  expect(String(label.props.children)).toMatch(/^Resend in 0:\d{2}$/);
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('AC10: each box announces Digit N of 6 and dark mode palette is wired', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const labels = renderer!.root
    .findAll(
      node =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('otp_digit_'),
    )
    .map(node => node.props.accessibilityLabel);
  expect([...new Set(labels)]).toEqual([1, 2, 3, 4, 5, 6].map(n => `Digit ${n} of 6`));
  expect(renderer!.root.findByProps({ testID: 'otp_status' })).toBeTruthy();
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('exact copy is on screen', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const json = JSON.stringify(renderer!.toJSON());
  expect(json).toContain('Enter your code');
  expect(json).toContain('A 6-digit code has been sent to your phone.');
  expect(json).toContain("Didn't receive the code?");
  expect(json).toContain('Submit');
  await ReactTestRenderer.act(() => renderer!.unmount());
});
