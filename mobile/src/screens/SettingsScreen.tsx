import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { useAuthStore } from "../stores/authStore";
import { useLogout } from "../api/queries";
import { Divider } from "../components/ui/Divider";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isRegistered, clearSession } = useAuthStore();
  const logout = useLogout();

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(t("profile.logout"), "Are you sure?", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          logout.mutate(undefined);
          await clearSession();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={t("profile.settings")} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Language */}
        <View style={styles.row}>
          <Text style={styles.label}>{t("profile.language")}</Text>
          <TouchableOpacity onPress={handleLanguageToggle}>
            <Text style={styles.value}>
              {i18n.language === "ar" ? "العربية" : "English"}
            </Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* Notifications */}
        <View style={styles.row}>
          <Text style={styles.label}>{t("profile.notifications")}</Text>
          <Switch
            trackColor={{ false: "#2A2A2A", true: "#00B856" }}
            thumbColor="#FFFFFF"
            value={true}
            onValueChange={() => {}}
          />
        </View>

        <Divider />

        {/* About */}
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>{t("profile.about")}</Text>
          <Text style={styles.chevron}>{">"}</Text>
        </TouchableOpacity>

        <Divider />

        {isRegistered && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>Draama v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: { color: "#FFFFFF", fontSize: 16 },
  value: { color: "#8B5CF6", fontSize: 16, fontWeight: "600" },
  chevron: { color: "#666666", fontSize: 16 },
  logoutButton: {
    marginTop: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
  version: { color: "#666666", fontSize: 12, textAlign: "center", marginTop: 24 },
});
