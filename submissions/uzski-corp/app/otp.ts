export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 30;
export const VALID_CODE = '123456';

export type Status = 'idle' | 'success' | 'error';

export function applyInput(
  digits: string[],
  index: number,
  text: string,
): { digits: string[]; focus: number } {
  const numbers = text.replace(/\D/g, '');
  if (!numbers) {
    return { digits, focus: index };
  }
  if (numbers.length >= OTP_LENGTH || numbers.length !== text.length) {
    const pasted = numbers.slice(0, OTP_LENGTH).split('');
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '');
    return { digits: next, focus: Math.min(pasted.length, OTP_LENGTH - 1) };
  }
  const next = [...digits];
  numbers
    .slice(0, OTP_LENGTH - index)
    .split('')
    .forEach((digit, offset) => {
      next[index + offset] = digit;
    });
  return { digits: next, focus: Math.min(index + numbers.length, OTP_LENGTH - 1) };
}

export function applyBackspace(
  digits: string[],
  index: number,
): { digits: string[]; focus: number } {
  const next = [...digits];
  if (next[index]) {
    next[index] = '';
    return { digits: next, focus: index };
  }
  if (index === 0) {
    return { digits: next, focus: 0 };
  }
  next[index - 1] = '';
  return { digits: next, focus: index - 1 };
}

export function verify(code: string): Status {
  return code === VALID_CODE ? 'success' : 'error';
}

export function formatCountdown(seconds: number): string {
  return `Resend in 0:${String(seconds).padStart(2, '0')}`;
}

export function isComplete(digits: string[]): boolean {
  return digits.length === OTP_LENGTH && digits.every(d => d !== '');
}

export function submit(
  digits: string[],
): { status: Status; digits: string[]; focus: number } {
  if (!isComplete(digits)) {
    return { status: 'idle', digits, focus: digits.findIndex(d => !d) || 0 };
  }
  const status = verify(digits.join(''));
  if (status === 'success') {
    return { status, digits, focus: OTP_LENGTH - 1 };
  }
  return { status: 'error', digits: Array(OTP_LENGTH).fill(''), focus: 0 };
}

export function tickResend(secondsLeft: number): number {
  return Math.max(0, secondsLeft - 1);
}

export function restartResend(secondsLeft: number): number {
  return secondsLeft === 0 ? RESEND_SECONDS : secondsLeft;
}
