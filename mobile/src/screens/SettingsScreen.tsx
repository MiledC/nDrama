import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type SettingsItemType = 'navigation' | 'toggle';

interface SettingsItemData {
  id: string;
  icon: string;
  label: string;
  type: SettingsItemType;
  value?: string;
  toggleKey?: string;
  onPress?: () => void;
}

interface SettingsGroupData {
  id: string;
  title: string;
  items: SettingsItemData[];
}

// ---------------------------------------------------------------------------
// Language options
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  {code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629'},
  {code: 'en', label: 'English'},
] as const;

function getLanguageLabel(code: string | null | undefined): string {
  const match = LANGUAGE_OPTIONS.find(l => l.code === code);
  return match?.label ?? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629';
}

// ---------------------------------------------------------------------------
// Data builder
// ---------------------------------------------------------------------------

function buildGroups(
  toggleState: Record<string, boolean>,
  currentLanguage: string,
  onLanguagePress: () => void,
  onClearCache: () => void,
  onClearHistory: () => void,
): SettingsGroupData[] {
  return [
    {
      id: 'general',
      title: '\u0639\u0627\u0645',
      items: [
        {
          id: 'language',
          icon: '\uD83C\uDF10',
          label: '\u0627\u0644\u0644\u063A\u0629',
          type: 'navigation',
          value: currentLanguage,
          onPress: onLanguagePress,
        },
        {
          id: 'video-quality',
          icon: '\uD83C\uDFAC',
          label: '\u062C\u0648\u062F\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648',
          type: 'navigation',
          value: '\u0639\u0627\u0644\u064A\u0629',
        },
        {
          id: 'downloads',
          icon: '\u2B07\uFE0F',
          label: '\u0627\u0644\u062A\u0646\u0632\u064A\u0644\u0627\u062A',
          type: 'navigation',
        },
      ],
    },
    {
      id: 'notifications',
      title: '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A',
      items: [
        {
          id: 'notify-episodes',
          icon: '\uD83D\uDD14',
          label: '\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629',
          type: 'toggle',
          toggleKey: 'newEpisodes',
        },
        {
          id: 'notify-promos',
          icon: '\uD83C\uDFF7\uFE0F',
          label: '\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0648\u0636',
          type: 'toggle',
          toggleKey: 'promotions',
        },
        {
          id: 'notify-daily',
          icon: '\uD83D\uDD25',
          label: '\u062A\u0630\u0643\u064A\u0631 \u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629',
          type: 'toggle',
          toggleKey: 'dailyReward',
        },
      ],
    },
    {
      id: 'storage',
      title: '\u0627\u0644\u062A\u062E\u0632\u064A\u0646',
      items: [
        {
          id: 'clear-cache',
          icon: '\uD83D\uDDD1\uFE0F',
          label: '\u0645\u0633\u062D \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646',
          type: 'navigation',
          value: '45 MB',
          onPress: onClearCache,
        },
        {
          id: 'clear-history',
          icon: '\uD83D\uDD52',
          label: '\u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629',
          type: 'navigation',
          onPress: onClearHistory,
        },
      ],
    },
    {
      id: 'about',
      title: '\u062D\u0648\u0644',
      items: [
        {
          id: 'terms',
          icon: '\uD83D\uDCC4',
          label: '\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629',
          type: 'navigation',
        },
        {
          id: 'privacy',
          icon: '\uD83D\uDEE1\uFE0F',
          label: '\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629',
          type: 'navigation',
        },
        {
          id: 'about-app',
          icon: '\u2139\uFE0F',
          label: '\u062D\u0648\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642',
          type: 'navigation',
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingsRow({
  item,
  isLast,
  toggleState,
  onToggle,
}: {
  item: SettingsItemData;
  isLast: boolean;
  toggleState: Record<string, boolean>;
  onToggle: (key: string, val: boolean) => void;
}) {
  const handlePress = () => {
    if (item.type === 'navigation' && item.onPress) {
      item.onPress();
    }
  };

  return (
    <>
      <Pressable
        style={styles.settingsRow}
        onPress={item.type === 'navigation' ? handlePress : undefined}>
        <Text style={styles.rowIcon}>{item.icon}</Text>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <View style={styles.rowRight}>
          {item.type === 'toggle' && item.toggleKey != null ? (
            <Switch
              value={toggleState[item.toggleKey] ?? false}
              onValueChange={val => onToggle(item.toggleKey!, val)}
              trackColor={{false: '#2A2A2A', true: colors.cta}}
              thumbColor={colors.text}
            />
          ) : (
            <>
              {item.value != null && (
                <Text style={styles.rowValue}>{item.value}</Text>
              )}
              <Text style={styles.rowChevron}>{'\u276E'}</Text>
            </>
          )}
        </View>
      </Pressable>
      {!isLast && <View style={styles.rowDivider} />}
    </>
  );
}

function SettingsGroup({
  group,
  toggleState,
  onToggle,
}: {
  group: SettingsGroupData;
  toggleState: Record<string, boolean>;
  onToggle: (key: string, val: boolean) => void;
}) {
  return (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{group.title}</Text>
      <View style={styles.groupCard}>
        {group.items.map((item, index) => (
          <SettingsRow
            key={item.id}
            item={item}
            isLast={index === group.items.length - 1}
            toggleState={toggleState}
            onToggle={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SettingsScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {data: profile} = useProfile();
  const updateProfile = useUpdateProfile();

  const [toggleState, setToggleState] = useState<Record<string, boolean>>({
    newEpisodes: true,
    promotions: true,
    dailyReward: true,
  });
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currentLanguageLabel = getLanguageLabel(profile?.language);

  const handleToggle = (key: string, value: boolean) => {
    setToggleState(prev => ({...prev, [key]: value}));
  };

  const handleLanguageSelect = (code: string) => {
    setLanguageModalVisible(false);
    updateProfile.mutate(
      {language: code},
      {
        onError: () => {
          Alert.alert(
            '\u062E\u0637\u0623',
            '\u0641\u0634\u0644 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0644\u063A\u0629',
          );
        },
      },
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      '\u0645\u0633\u062D \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646',
      '\u0647\u0644 \u062A\u0631\u064A\u062F \u0645\u0633\u062D \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u0624\u0642\u062A\u0629\u061F',
      [
        {text: '\u0625\u0644\u063A\u0627\u0621', style: 'cancel'},
        {
          text: '\u0645\u0633\u062D',
          style: 'destructive',
          onPress: () => console.log('Cache cleared'),
        },
      ],
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      '\u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629',
      '\u0647\u0644 \u062A\u0631\u064A\u062F \u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u061F',
      [
        {text: '\u0625\u0644\u063A\u0627\u0621', style: 'cancel'},
        {
          text: '\u0645\u0633\u062D',
          style: 'destructive',
          onPress: () => console.log('Watch history cleared'),
        },
      ],
    );
  };

  const groups = buildGroups(
    toggleState,
    currentLanguageLabel,
    () => setLanguageModalVisible(true),
    handleClearCache,
    handleClearHistory,
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <Text style={styles.backIcon}>{'\u276F'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {'\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {groups.map(group => (
          <SettingsGroup
            key={group.id}
            group={group}
            toggleState={toggleState}
            onToggle={handleToggle}
          />
        ))}

        <Text style={styles.versionText}>Draama v1.0.0</Text>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {'\u0627\u0644\u0644\u063A\u0629'}
            </Text>
            {LANGUAGE_OPTIONS.map(option => {
              const isSelected = profile?.language === option.code ||
                (!profile?.language && option.code === 'ar');
              return (
                <Pressable
                  key={option.code}
                  style={[
                    styles.languageOption,
                    isSelected && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageSelect(option.code)}>
                  <Text
                    style={[
                      styles.languageOptionText,
                      isSelected && styles.languageOptionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.languageCheck}>{'\u2713'}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 52;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.section * 2,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 16,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  headerSpacer: {
    width: 36,
  },

  /* ---- Group ---- */
  groupContainer: {
    marginTop: spacing.section,
  },
  groupTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    overflow: 'hidden',
  },

  /* ---- Settings row ---- */
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
    color: colors.textMuted,
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    color: colors.text,
    writingDirection: 'rtl',
    marginStart: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginStart: spacing.sm,
  },
  rowValue: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
  },
  rowChevron: {
    fontSize: 14,
    color: colors.textDim,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  /* ---- Language Modal ---- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSizes.sectionTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.thumbnail,
    marginBottom: spacing.sm,
  },
  languageOptionSelected: {
    backgroundColor: colors.cardElevated,
  },
  languageOptionText: {
    fontSize: fontSizes.body,
    color: colors.text,
  },
  languageOptionTextSelected: {
    fontWeight: fontWeights.bold,
    color: colors.cta,
  },
  languageCheck: {
    fontSize: 18,
    color: colors.cta,
    fontWeight: fontWeights.bold,
  },

  /* ---- Footer ---- */
  versionText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.section,
  },

  /* ---- Bottom spacer ---- */
  bottomSpacer: {
    height: spacing.section,
  },
});
