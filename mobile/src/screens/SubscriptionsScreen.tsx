import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { Button } from "../components/ui/Button";

const PLANS = [
  {
    id: "free",
    nameKey: "subscriptions.freePlan",
    price: "Free",
    features: ["Watch free episodes", "Earn daily coins", "Ads included"],
  },
  {
    id: "monthly",
    nameKey: "subscriptions.monthlyPlan",
    price: "$4.99/mo",
    features: ["Unlimited episodes", "No ads", "Download offline", "2x daily coins"],
    popular: true,
  },
  {
    id: "annual",
    nameKey: "subscriptions.annualPlan",
    price: "$39.99/yr",
    features: ["Everything in Monthly", "Save 33%", "Exclusive content", "3x daily coins"],
  },
];

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("subscriptions.subscribe")}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planSelected,
              plan.popular && styles.planPopular,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <Text style={styles.planName}>{t(plan.nameKey)}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            {plan.features.map((f, i) => (
              <Text key={i} style={styles.feature}>
                {"- "}{f}
              </Text>
            ))}
          </TouchableOpacity>
        ))}

        <Button
          title={t("subscriptions.subscribe")}
          onPress={() => {}}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.subscribeButton}
        />

        <TouchableOpacity style={styles.manageLink}>
          <Text style={styles.manageLinkText}>
            {t("subscriptions.manageSub")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  planCard: {
    backgroundColor: "#1F1133",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planSelected: { borderColor: "#8B5CF6" },
  planPopular: { borderColor: "#D4A843" },
  popularBadge: {
    backgroundColor: "#D4A843",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  popularText: { color: "#0D0D0D", fontSize: 11, fontWeight: "700" },
  planName: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  planPrice: { color: "#8B5CF6", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  feature: { color: "#A3A3A3", fontSize: 14, marginBottom: 4 },
  subscribeButton: { marginTop: 16 },
  manageLink: { alignItems: "center", marginTop: 16 },
  manageLinkText: { color: "#8B5CF6", fontSize: 14 },
});
