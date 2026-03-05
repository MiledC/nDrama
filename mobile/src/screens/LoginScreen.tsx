import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { AuthStackParamList } from "../navigation/types";

type LoginNav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginNav>();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handleContinue = () => {
    // Basic Saudi phone validation: starts with 5, 9 digits total
    const cleaned = phone.replace(/\s/g, "");
    if (!/^5\d{8}$/.test(cleaned)) {
      setPhoneError(t("auth.phone") + " - invalid");
      return;
    }
    setPhoneError("");
    navigation.navigate("OTP", { phone: `+966${cleaned}` });
  };

  const handleSkip = () => {
    navigation.getParent()?.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Logo */}
        <Text style={styles.logo}>
          <Text style={styles.logoAccent}>D</Text>raama
        </Text>

        {/* Headline */}
        <Text style={styles.headline}>{t("auth.login")}</Text>
        <Text style={styles.subtext}>{t("auth.loginSubtext")}</Text>

        {/* Phone Input */}
        <View style={styles.phoneSection}>
          <Text style={styles.label}>{t("auth.phone")}</Text>
          <View style={styles.phoneRow}>
            {/* Country code selector */}
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇸🇦 +966</Text>
            </View>
            {/* Phone input */}
            <View style={styles.phoneInputWrapper}>
              <Input
                placeholder={t("auth.phonePlaceholder")}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError("");
                }}
                keyboardType="phone-pad"
                maxLength={11}
                error={phoneError}
              />
            </View>
          </View>
        </View>

        {/* Continue button */}
        <Button
          title={t("auth.continue")}
          onPress={handleContinue}
          variant="primary"
          size="md"
          fullWidth
          style={styles.continueButton}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("auth.orContinueWith")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social login buttons */}
        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
          <Text style={styles.socialButtonText}>
            {t("auth.loginWithGoogle")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.socialButtonSpacing]}
          activeOpacity={0.7}
        >
          <Text style={styles.socialButtonText}>
            {t("auth.loginWithApple")}
          </Text>
        </TouchableOpacity>

        {/* Spacer to push bottom content down */}
        <View style={styles.spacer} />

        {/* Terms */}
        <Text style={styles.termsText}>
          {t("auth.termsPrefix")}
          <Text style={styles.termsLink}>{t("auth.termsOfService")}</Text>
          {t("auth.and")}
          <Text style={styles.termsLink}>{t("auth.privacyPolicy")}</Text>
        </Text>

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t("auth.skipForNow")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 32,
  },
  logoAccent: {
    color: "#8B5CF6",
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#A3A3A3",
    textAlign: "center",
    marginBottom: 32,
  },
  phoneSection: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
  },
  countryCode: {
    backgroundColor: "#2A1845",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  phoneInputWrapper: {
    flex: 1,
  },
  continueButton: {
    marginTop: 8,
    borderRadius: 24,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2A2A2A",
  },
  dividerText: {
    color: "#666666",
    fontSize: 13,
    marginHorizontal: 12,
  },
  socialButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#2A1845",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonSpacing: {
    marginTop: 12,
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  termsText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  termsLink: {
    color: "#8B5CF6",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "500",
  },
});
