import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  I18nManager,
} from "react-native";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          error ? styles.error : undefined,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : undefined]}
          placeholderTextColor="#666666"
          selectionColor="#8B5CF6"
          textAlign={I18nManager.isRTL ? "right" : "left"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  label: {
    color: "#A3A3A3",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1845",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  focused: {
    borderColor: "#8B5CF6",
  },
  error: {
    borderColor: "#EF4444",
  },
  icon: {
    marginEnd: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    height: "100%",
  },
  inputWithIcon: {
    paddingStart: 0,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
});
