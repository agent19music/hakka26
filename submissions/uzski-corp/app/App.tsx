import { ComponentRef, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {
  applyBackspace,
  applyInput,
  formatCountdown,
  isComplete,
  OTP_LENGTH,
  RESEND_SECONDS,
  Status,
  submit,
} from './otp';
import {
  behindChrome,
  colors as palettes,
  EMPTY_PLACEHOLDER,
  radii,
  sizes,
  spacing,
  type,
} from './theme';

// Web-only: kill UA focus ring so Bau border is the only focus chrome.
const webDigitReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as const)
    : ({} as const);

export default function App() {

  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? palettes.dark : palettes.light;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const resendSeconds =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? Number(new URLSearchParams(window.location.search).get('resend')) || RESEND_SECONDS
      : RESEND_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(resendSeconds);
  const inputs = useRef<Array<ComponentRef<typeof TextInput> | null>>([]);

  useEffect(() => {
    inputs.current[focus]?.focus();
  }, [focus, status]);

  useEffect(() => {
    if (secondsLeft === 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const complete = isComplete(digits);

  const onChange = (index: number, text: string) => {
    if (!text) {
      const next = applyBackspace(digits, index);
      setDigits(next.digits);
      setFocus(next.focus);
      return;
    }
    const typed = text.startsWith(digits[index])
      ? text.slice(digits[index].length) || text
      : text;
    const next = applyInput(digits, index, typed);
    setDigits(next.digits);
    setFocus(next.focus);
    setStatus('idle');
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index]) {
      const next = applyBackspace(digits, index);
      setDigits(next.digits);
      setFocus(next.focus);
    }
  };

  const onSubmit = () => {
    const result = submit(digits);
    setStatus(result.status);
    setDigits(result.digits);
    setFocus(result.focus);
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? behindChrome.dark : behindChrome.light },
      ]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={[styles.behind, { color: colors.textPrimary }]}>Welcome back</Text>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
      <View style={[styles.sheet, { backgroundColor: colors.sheet }]}>
        <Image
          source={require('./assets/thamani-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Thamani logo"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Enter your code</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          A 6-digit code has been sent to your phone.
        </Text>
        <View style={styles.digits}>
          {digits.map((digit, index) => {
            const focused = focus === index && !digit;
            const filled = digit.length > 0;
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
                placeholder={focused ? '' : EMPTY_PLACEHOLDER}
                placeholderTextColor={colors.digitPlaceholder}
                keyboardType="number-pad"
                autoFocus={index === 0}
                textContentType="oneTimeCode"
                caretHidden={false}
                selectionColor={colors.digitFocusedOutline}
                onFocus={() => setFocus(index)}
                onChangeText={text => onChange(index, text)}
                onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
                style={[
                  styles.digit,
                  webDigitReset,
                  filled
                    ? {
                        backgroundColor: colors.digitFilledBg,
                        borderWidth: sizes.digitOutlineEmpty,
                        borderColor: colors.digitFilledBg,
                        color: colors.digitFilledText,
                      }
                    : focused
                      ? {
                          backgroundColor: colors.digitFocusedBg,
                          borderWidth: sizes.digitOutlineFocused,
                          borderColor: colors.digitFocusedOutline,
                          color: colors.digitFilledText,
                        }
                      : {
                          backgroundColor: colors.digitEmptyBg,
                          borderWidth: sizes.digitOutlineEmpty,
                          borderColor: colors.digitEmptyOutline,
                          color: colors.digitFilledText,
                        },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.resendRow}>
          <Text style={[styles.resend, { color: colors.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <Pressable
            testID="otp_resend"
            disabled={secondsLeft > 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: secondsLeft > 0 }}
            onPress={() => setSecondsLeft(resendSeconds)}>
            <Text
              style={[
                styles.resendEmph,
                {
                  color: secondsLeft > 0 ? colors.textSecondary : colors.link,
                },
              ]}>
              {secondsLeft > 0 ? formatCountdown(secondsLeft) : 'Resend'}
            </Text>
          </Pressable>
        </View>
        <Text
          testID="otp_status"
          accessibilityLiveRegion="polite"
          style={[
            styles.status,
            status === 'success'
              ? { color: colors.success }
              : status === 'error'
                ? { color: colors.error }
                : { color: colors.textSecondary },
          ]}>
          {status === 'success'
            ? "You're in."
            : status === 'error'
              ? "That code didn't work. Try again."
              : ''}
        </Text>
        <View style={styles.spacer} />
        <Pressable
          testID="otp_submit"
          disabled={!complete}
          accessibilityRole="button"
          accessibilityState={{ disabled: !complete }}
          onPress={onSubmit}
          style={[
            styles.button,
            {
              backgroundColor: complete ? colors.buttonBg : colors.buttonDisabledBg,
            },
          ]}>
          <Text style={[styles.buttonLabel, { color: colors.buttonText }]}>Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  behind: {
    marginTop: 72,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '500',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: sizes.sheetHPct,
    borderTopLeftRadius: radii.sheetTop,
    borderTopRightRadius: radii.sheetTop,
    paddingHorizontal: spacing.sheetPadH,
    paddingVertical: spacing.sheetPadV,
    alignItems: 'center',
  },
  logo: { width: sizes.logoW, height: sizes.logoH },
  title: {
    marginTop: spacing.logoToTitle,
    textAlign: 'center',
    ...type.title,
  },
  subtitle: {
    marginTop: spacing.titleToSubtitle,
    textAlign: 'center',
    maxWidth: sizes.subtitleMaxW,
    ...type.subtitle,
  },
  digits: {
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
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.digitsToResend,
  },
  resend: { ...type.resend },
  resendEmph: { ...type.resendEmph },
  status: {
    marginTop: spacing.resendToStatus,
    minHeight: spacing.statusMinHeight,
    textAlign: 'center',
    ...type.status,
  },
  spacer: { flex: 1 },
  button: {
    alignSelf: 'stretch',
    height: sizes.buttonH,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { ...type.button },
});
