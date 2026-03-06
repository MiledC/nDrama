import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Login / Sign-up screen.
 *
 * Full-screen dark layout with phone number input, Continue button,
 * social login (Google placeholder), and terms text.
 * No tab bar is shown on this screen.
 */
const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  // Valid Saudi mobile: starts with 5, exactly 9 digits
  const isValid = /^5\d{8}$/.test(phoneNumber);

  const handleContinue = () => {
    if (!isValid) return;
    navigation.navigate('Otp', {phoneNumber});
  };

  const handleGoogleLogin = () => {
    // Placeholder — will integrate Google OAuth later
    console.log('Google login pressed');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ---------- Top section: Logo + Titles (≈40% height) ---------- */}
        <View style={styles.topSection}>
          {/* Draama logo */}
          <Text style={styles.logo}>
            <Text style={styles.logoAccent}>D</Text>
            raama
          </Text>
          {/* Green underline */}
          <View style={styles.logoLine} />

          {/* Title */}
          <Text style={styles.title}>{'سجل دخولك'}</Text>
          {/* Subtitle */}
          <Text style={styles.subtitle}>{'ادخل رقم هاتفك للمتابعة'}</Text>
        </View>

        {/* ---------- Input section ---------- */}
        <View style={styles.inputSection}>
          {/* Phone input row */}
          <View style={styles.phoneRow}>
            {/* Country code pill */}
            <Pressable style={styles.countryCode}>
              <Text style={styles.countryCodeText}>{'🇸🇦 +966'}</Text>
              <Text style={styles.chevron}>{'▾'}</Text>
            </Pressable>

            {/* Phone number input */}
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="5XXXXXXXX"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
              maxLength={9}
              autoFocus
            />
          </View>

          {/* Continue button */}
          <Pressable
            style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}>
            <Text
              style={[
                styles.continueBtnText,
                !isValid && styles.continueBtnTextDisabled,
              ]}>
              {'متابعة'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{'أو'}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google login */}
          <Pressable style={styles.socialBtn} onPress={handleGoogleLogin}>
            <Text style={styles.googleIcon}>{'G'}</Text>
            <Text style={styles.socialBtnText}>{'المتابعة مع Google'}</Text>
          </Pressable>
        </View>

        {/* ---------- Bottom: Terms ---------- */}
        <View style={styles.bottomSection}>
          <Text style={styles.termsText}>
            {'بالمتابعة، أنت توافق على '}
            <Text style={styles.termsLink}>{'شروط الخدمة'}</Text>
            {' و'}
            <Text style={styles.termsLink}>{'سياسة الخصوصية'}</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },

  /* ---- Top section ---- */
  topSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: 1.5,
  },
  logoAccent: {
    color: colors.cta,
  },
  logoLine: {
    width: 32,
    height: 2,
    backgroundColor: colors.cta,
    marginTop: spacing.sm,
    borderRadius: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  /* ---- Input section ---- */
  inputSection: {
    paddingHorizontal: spacing.lg,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    height: sizes.buttonHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    gap: spacing.xs,
  },
  countryCodeText: {
    color: colors.text,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 10,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    height: sizes.buttonHeight,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSizes.body,
  },

  /* ---- Continue button ---- */
  continueBtn: {
    backgroundColor: colors.cta,
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  continueBtnDisabled: {
    backgroundColor: colors.cardElevated,
  },
  continueBtnText: {
    color: colors.text,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
  },
  continueBtnTextDisabled: {
    color: colors.textDim,
  },

  /* ---- Divider ---- */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSizes.body,
    marginHorizontal: spacing.md,
  },

  /* ---- Social login ---- */
  socialBtn: {
    flexDirection: 'row',
    backgroundColor: colors.cardElevated,
    height: sizes.buttonHeight,
    borderRadius: radii.card,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleIcon: {
    color: colors.text,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },

  /* ---- Bottom ---- */
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  termsText: {
    fontSize: fontSizes.tabLabel,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.cta,
  },
});
