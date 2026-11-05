import { ComponentRef, useEffect, useRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { OTP_LENGTH } from '../otp';
import {
  colors as palettes,
  EMPTY_PLACEHOLDER,
  radii,
  sizes,
  spacing,
  type,
} from '../theme';

export type OtpPalette = (typeof palettes)['light'];

export type DigitState = 'filled' | 'focused' | 'empty';

export function digitState(digit: string, isFocusIndex: boolean): DigitState {
  if (digit.length > 0) {
    return 'filled';
  }
  if (isFocusIndex) {
    return 'focused';
  }
  return 'empty';
}

type DigitStyleMap = Record<
  DigitState,
  {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    color: string;
  }
>;

export function digitStyleMap(colors: OtpPalette): DigitStyleMap {
  return {
    filled: {
      backgroundColor: colors.digitFilledBg,
      borderWidth: sizes.digitOutlineEmpty,
      borderColor: colors.digitFilledBg,
      color: colors.digitFilledText,
    },
    focused: {
      backgroundColor: colors.digitFocusedBg,
      borderWidth: sizes.digitOutlineFocused,
      borderColor: colors.digitFocusedOutline,
      color: colors.digitFilledText,
    },
    empty: {
      backgroundColor: colors.digitEmptyBg,
      borderWidth: sizes.digitOutlineEmpty,
      borderColor: colors.digitEmptyOutline,
      color: colors.digitFilledText,
    },
  };
}

const webDigitReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as const)
    : ({} as const);

type OtpInputProps = {
  digits: string[];
  focusIndex: number;
  colors: OtpPalette;
  /** Re-run focus when this changes (e.g. status after submit). */
  refocusKey?: string | number;
  onChangeText: (index: number, text: string) => void;
  onKeyPress: (index: number, key: string) => void;
  onFocusIndex: (index: number) => void;
};

export function OtpInput({
  digits,
  focusIndex,
  colors,
  refocusKey,
  onChangeText,
  onKeyPress,
  onFocusIndex,
}: OtpInputProps) {
  const inputs = useRef<Array<ComponentRef<typeof TextInput> | null>>([]);
  const stylesByState = digitStyleMap(colors);

  useEffect(() => {
    inputs.current[focusIndex]?.focus();
  }, [focusIndex, refocusKey]);

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => {
        const state = digitState(digit, focusIndex === index);
        return (
          <TextInput
            key={index}
            ref={ref => {
              inputs.current[index] = ref;
            }}
            testID={`otp_digit_${index + 1}`}
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
            value={digit}
            // Focused empty: caret only — no placeholder behind the caret (Bau).
            placeholder={state === 'focused' ? '' : EMPTY_PLACEHOLDER}
            placeholderTextColor={colors.digitPlaceholder}
            keyboardType="number-pad"
            autoFocus={index === 0}
            textContentType="oneTimeCode"
            caretHidden={false}
            selectionColor={colors.digitFocusedOutline}
            onFocus={() => onFocusIndex(index)}
            onChangeText={text => onChangeText(index, text)}
            onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
            style={[styles.digit, webDigitReset, stylesByState[state]]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.subtitleToDigits,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.digitsGap,
  },
  digit: {
    width: sizes.digit,
    height: sizes.digit,
    borderRadius: radii.digit,
    textAlign: 'center',
    padding: 0,
    ...type.digit,
  },
});
