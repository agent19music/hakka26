import colours from './assets/colours.json';

type OtpPalette = typeof colours.otp.light;

function parseScrim(argb: string): string {
  // colours.json uses #AARRGGBB
  const hex = argb.replace('#', '');
  if (hex.length !== 8) {
    return argb;
  }
  const a = parseInt(hex.slice(0, 2), 16) / 255;
  const r = parseInt(hex.slice(2, 4), 16);
  const g = parseInt(hex.slice(4, 6), 16);
  const b = parseInt(hex.slice(6, 8), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

function mapPalette(p: OtpPalette) {
  return {
    sheet: p.sheet,
    scrim: parseScrim(p.scrim),
    textPrimary: p.text_primary,
    textSecondary: p.text_secondary,
    digitFilledBg: p.digit_filled_bg,
    digitFilledText: p.digit_filled_text,
    digitFocusedBg: p.digit_focused_bg,
    digitFocusedOutline: p.digit_focused_outline,
    digitEmptyBg: p.digit_empty_bg,
    digitEmptyOutline: p.digit_empty_outline,
    digitPlaceholder: p.digit_placeholder,
    buttonBg: p.button_bg,
    buttonText: p.button_text,
    buttonDisabledBg: p.button_disabled_bg,
    link: p.link,
    success: p.success,
    error: p.error,
  } as const;
}

export const colors = {
  light: mapPalette(colours.otp.light),
  dark: mapPalette(colours.otp.dark),
} as const;

/** Decorative behind-sheet chrome from Bau frames — not in colours.json */
export const behindChrome = {
  light: '#E8EAE9',
  dark: '#0E1110',
} as const;

export const spacing = {
  sheetPadH: 24,
  sheetPadV: 28,
  logoToTitle: 20,
  titleToSubtitle: 8,
  subtitleToDigits: 28,
  digitsGap: 10,
  digitsToResend: 24,
  resendToStatus: 16,
  statusMinHeight: 22,
} as const;

export const radii = {
  sheetTop: 28,
  digit: 23,
  button: 28,
} as const;

export const sizes = {
  sheetHPct: '86%' as const,
  logoW: 56,
  logoH: 45,
  digit: 46,
  digitOutlineFocused: 2,
  digitOutlineEmpty: 1,
  buttonH: 56,
  subtitleMaxW: 280,
} as const;

export const type = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: '500' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  digit: { fontSize: 20, lineHeight: 24, fontWeight: '500' as const },
  resend: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  resendEmph: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  status: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '500' as const },
} as const;

/** Empty placeholder — en-dash U+2013, never a real 0 */
export const EMPTY_PLACEHOLDER = '\u2013';
