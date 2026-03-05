import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLogin } from "../api/queries";
import { useAuthStore } from "../stores/authStore";
import type { SubscriberProfile } from "../stores/authStore";
import type { AuthStackParamList, RootStackParamList } from "../navigation/types";

type OTPRoute = RouteProp<AuthStackParamList, "OTP">;
type OTPNav = NativeStackNavigationProp<AuthStackParamList, "OTP">;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function maskPhone(phone: string): string {
  // e.g. +966 5X XXX **89 — show first 7 chars, mask middle, show last 2
  if (phone.length <= 7) return phone;
  const visible = phone.slice(0, 7);
  const last = phone.slice(-2);
  const masked = "*".repeat(Math.max(0, phone.length - 9));
  return `${visible} ${masked}${last}`;
}

export default function OTPScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<OTPNav>();
  const route = useRoute<OTPRoute>();
  const insets = useSafeAreaInsets();
  const { phone } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const loginMutation = useLogin();
  const setSession = useAuthStore((s) => s.setSession);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(RESEND_SECONDS);
    setError("");
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  const submitOtp = useCallback(
    async (code: string) => {
      if (verifying) return;
      setVerifying(true);
      setError("");

      try {
        // Simulate OTP verification with a 1.5s delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Then call auth API login (using phone as email placeholder for now)
        const result = await loginMutation.mutateAsync({
          email: phone,
          password: code,
        });

        await setSession(
          result.session_token,
          result.subscriber as unknown as SubscriberProfile,
        );

        // Navigate to Main after successful login
        const rootNav =
          navigation.getParent<
            NativeStackNavigationProp<RootStackParamList>
          >();
        if (rootNav) {
          rootNav.reset({ index: 0, routes: [{ name: "Main" }] });
        }
      } catch {
        setError(t("auth.invalidOtp"));
        setVerifying(false);
      }
    },
    [verifying, loginMutation, phone, setSession, navigation, t],
  );

  const handleChange = (text: string, index: number) => {
    if (error) setError("");

    const newDigits = [...digits];

    // Handle paste (multiple characters)
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const pastedArr = pasted.split("");
      for (let i = 0; i < OTP_LENGTH; i++) {
        newDigits[i] = pastedArr[i] || "";
      }
      setDigits(newDigits);
      // Focus last filled or last box
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      // Auto-submit if all filled
      if (pasted.length >= OTP_LENGTH) {
        submitOtp(newDigits.join(""));
      }
      return;
    }

    // Single character
    const digit = text.replace(/\D/g, "");
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      // Auto-advance to next input
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && newDigits.every((d) => d !== "")) {
      submitOtp(newDigits.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Heading */}
        <Text style={styles.heading}>{t("auth.otpTitle")}</Text>
        <Text style={styles.subtext}>
          {t("auth.otpSubtext")}{"\n"}
          <Text style={styles.phoneText}>{maskPhone(phone)}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.otpBox,
                digits[i] ? styles.otpBoxFilled : undefined,
                error ? styles.otpBoxError : undefined,
              ]}
              value={digits[i]}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              keyboardType="number-pad"
              maxLength={i === 0 ? OTP_LENGTH : 1}
              textContentType="oneTimeCode"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              selectionColor="#8B5CF6"
              editable={!verifying}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verifying indicator */}
        {verifying && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator color="#8B5CF6" size="small" />
            <Text style={styles.verifyingText}>{t("auth.verifying")}</Text>
          </View>
        )}

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0}
          style={styles.resendButton}
        >
          <Text
            style={[
              styles.resendText,
              countdown > 0 ? styles.resendDisabled : styles.resendActive,
            ]}
          >
            {countdown > 0
              ? t("auth.resendIn", { seconds: countdown })
              : t("auth.resendOtp")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
    padding: 4,
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: "#A3A3A3",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: "#2A1845",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: "#8B5CF6",
  },
  otpBoxError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  verifyingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  verifyingText: {
    color: "#A3A3A3",
    fontSize: 14,
    marginStart: 8,
  },
  resendButton: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  resendDisabled: {
    color: "#666666",
  },
  resendActive: {
    color: "#8B5CF6",
  },
});
