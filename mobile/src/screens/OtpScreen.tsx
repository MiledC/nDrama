import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, radii, sizes, spacing} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

/**
 * OTP verification screen.
 *
 * Receives the phone number from LoginScreen and shows 4 separate digit
 * boxes. Auto-advances focus on input, auto-submits when all digits
 * are entered, and includes a 30-second resend countdown.
 */
const OtpScreen: React.FC<Props> = ({navigation, route}) => {
  const {phoneNumber} = route.params;

  // Each digit stored individually
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  // Refs for each TextInput
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ---------- Countdown timer ----------
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // ---------- Auto-submit when all digits filled ----------
  const handleAutoSubmit = useCallback(
    (newDigits: string[]) => {
      const code = newDigits.join('');
      if (code.length === OTP_LENGTH && newDigits.every(d => d !== '')) {
        // Navigate to MainTabs with stack reset
        navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
      }
    },
    [navigation],
  );

  // ---------- Digit input handler ----------
  const handleChangeText = (text: string, index: number) => {
    // Only accept single digit
    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      // Auto-advance to next box
      inputRefs.current[index + 1]?.focus();
    }

    handleAutoSubmit(newDigits);
  };

  // ---------- Backspace handler ----------
  const handleKeyPress = (
    e: {nativeEvent: {key: string}},
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      // Move focus to previous box and clear it
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ---------- Resend handler ----------
  const handleResend = () => {
    if (countdown > 0) return;
    // Reset digits and countdown
    setDigits(Array(OTP_LENGTH).fill(''));
    setCountdown(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
    console.log('Resend OTP to', phoneNumber);
  };

  // ---------- Confirm handler ----------
  const handleConfirm = () => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH) {
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    }
  };

  const isComplete = digits.every(d => d !== '');

  // Format countdown as 00:XX
  const countdownText = `00:${countdown.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ---------- Back button ---------- */}
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>{'←'}</Text>
      </Pressable>

      {/* ---------- Title section ---------- */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{'التحقق'}</Text>
        <Text style={styles.subtitle}>
          {'أدخل الرمز المرسل إلى '}
          <Text style={styles.phoneHighlight}>{`+966 ${phoneNumber}`}</Text>
        </Text>
      </View>

      {/* ---------- OTP input boxes ---------- */}
      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              focusedIndex === index && styles.otpBoxFocused,
            ]}
            value={digit}
            onChangeText={text => handleChangeText(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={index === 0}
            selectionColor={colors.cta}
          />
        ))}
      </View>

      {/* ---------- Confirm button ---------- */}
      <View style={styles.confirmSection}>
        <Pressable
          style={[styles.confirmBtn, !isComplete && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!isComplete}>
          <Text
            style={[
              styles.confirmBtnText,
              !isComplete && styles.confirmBtnTextDisabled,
            ]}>
            {'تأكيد'}
          </Text>
        </Pressable>
      </View>

      {/* ---------- Resend section ---------- */}
      <View style={styles.resendSection}>
        <Text style={styles.resendLabel}>{'لم تستلم الرمز؟'}</Text>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>{countdownText}</Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text style={styles.resendLink}>{'إعادة الإرسال'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

export default OtpScreen;

// ---------- Styles ----------

const OTP_BOX_SIZE = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },

  /* ---- Back button ---- */
  backBtn: {
    marginTop: spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: colors.text,
    fontSize: 22,
  },

  /* ---- Title ---- */
  titleSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.section,
  },
  title: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: colors.cta,
    fontWeight: fontWeights.semibold,
  },

  /* ---- OTP boxes ---- */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.section,
  },
  otpBox: {
    width: OTP_BOX_SIZE,
    height: OTP_BOX_SIZE,
    borderRadius: radii.card,
    backgroundColor: colors.cardElevated,
    color: colors.text,
    fontSize: 24,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpBoxFocused: {
    borderColor: colors.cta,
  },

  /* ---- Confirm button ---- */
  confirmSection: {
    marginBottom: spacing.xxl,
  },
  confirmBtn: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: colors.cardElevated,
  },
  confirmBtnText: {
    color: colors.text,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
  },
  confirmBtnTextDisabled: {
    color: colors.textDim,
  },

  /* ---- Resend ---- */
  resendSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  resendLabel: {
    fontSize: fontSizes.tabLabel,
    color: colors.textMuted,
  },
  countdownText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
  },
  resendLink: {
    fontSize: fontSizes.body,
    color: colors.cta,
    fontWeight: fontWeights.semibold,
  },
});
