import React, {useRef} from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {colors, fontSizes, fontWeights, spacing, radii, sizes} from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onCancel?: () => void;
  isFocused: boolean;
}

/**
 * Sticky search bar with magnifying glass, mic hint, and cancel button.
 * RTL-first layout with Arabic placeholder.
 */
export default function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  isFocused,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  const handleCancel = () => {
    onChangeText('');
    inputRef.current?.blur();
    onCancel?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {/* Magnifying glass icon (leading side) */}
        <Text style={styles.searchIcon}>&#x1F50D;</Text>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="ابحث عن مسلسلات..."
          placeholderTextColor={colors.textDim}
          selectionColor={colors.cta}
          textAlign="right"
          autoCorrect={false}
          returnKeyType="search"
        />

        {/* Microphone icon hint (trailing side) */}
        {!isFocused && (
          <Text style={styles.micIcon}>&#x1F3A4;</Text>
        )}
      </View>

      {/* Cancel button appears when focused */}
      {isFocused && (
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text style={styles.cancelText}>إلغاء</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: sizes.searchBarHeight,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textDim,
    marginEnd: spacing.sm,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: sizes.searchBarHeight,
    color: colors.text,
    fontSize: fontSizes.body,
    paddingVertical: 0,
    writingDirection: 'rtl',
  },
  micIcon: {
    fontSize: 16,
    color: colors.textDim,
    marginStart: spacing.sm,
    opacity: 0.7,
  },
  cancelText: {
    color: colors.cta,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    writingDirection: 'rtl',
  },
});
