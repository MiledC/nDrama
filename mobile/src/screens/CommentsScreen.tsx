import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {colors, fontSizes, fontWeights, spacing, radii} from '../theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Comments'>;

interface Comment {
  id: string;
  name: string;
  text: string;
  likes: number;
  time: string;
  liked: boolean;
}

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    name: '\u0633\u0627\u0631\u0629',
    text: '\u0647\u0630\u0647 \u0627\u0644\u062D\u0644\u0642\u0629 \u0631\u0627\u0626\u0639\u0629! \u0645\u0627 \u062A\u0648\u0642\u0639\u062A \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u0623\u0628\u062F\u0627\u064B \uD83D\uDE31',
    likes: 45,
    time: '\u0645\u0646\u0630 \u0633\u0627\u0639\u062A\u064A\u0646',
    liked: false,
  },
  {
    id: '2',
    name: '\u0645\u062D\u0645\u062F',
    text: '\u0623\u0641\u0636\u0644 \u0645\u0633\u0644\u0633\u0644 \u0634\u0627\u0647\u062F\u062A\u0647 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0645',
    likes: 32,
    time: '\u0645\u0646\u0630 3 \u0633\u0627\u0639\u0627\u062A',
    liked: false,
  },
  {
    id: '3',
    name: '\u0646\u0648\u0631\u0629',
    text: '\u0645\u064A\u0646 \u064A\u0639\u0631\u0641 \u0645\u062A\u0649 \u062A\u0646\u0632\u0644 \u0627\u0644\u062D\u0644\u0642\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629\u061F',
    likes: 12,
    time: '\u0623\u0645\u0633',
    liked: false,
  },
  {
    id: '4',
    name: '\u062E\u0627\u0644\u062F',
    text: '\u0627\u0644\u062A\u0645\u062B\u064A\u0644 \u0645\u0645\u062A\u0627\u0632 \u0648\u0627\u0644\u0625\u062E\u0631\u0627\u062C \u0639\u0627\u0644\u0645\u064A \uD83D\uDD25',
    likes: 67,
    time: '\u0642\u0628\u0644 \u064A\u0648\u0645\u064A\u0646',
    liked: false,
  },
  {
    id: '5',
    name: '\u0631\u064A\u0645',
    text: '\u0623\u0628\u0643\u0627\u0646\u064A \u0627\u0644\u0645\u0634\u0647\u062F \u0627\u0644\u0623\u062E\u064A\u0631 \uD83D\uDE2D',
    likes: 89,
    time: '\u0642\u0628\u0644 3 \u0623\u064A\u0627\u0645',
    liked: false,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Drag handle indicator at the top of the sheet */
function DragHandle() {
  return (
    <View style={styles.dragHandleWrapper}>
      <View style={styles.dragHandle} />
    </View>
  );
}

/** Sheet header with title, count, and close button */
function SheetHeader({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
        <Text style={styles.closeIcon}>{'\u2715'}</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerCount}>{count}</Text>
        <Text style={styles.headerTitle}>
          {'\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A'}
        </Text>
      </View>
      {/* Invisible spacer to balance the layout */}
      <View style={styles.headerSpacer} />
    </View>
  );
}

/** Avatar circle with initials */
function Avatar({name, size}: {name: string; size: number}) {
  const initial = name.charAt(0);
  return (
    <View
      style={[
        styles.avatar,
        {width: size, height: size, borderRadius: size / 2},
      ]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.4}]}>{initial}</Text>
    </View>
  );
}

/** Single comment item */
function CommentItem({
  comment,
  onLike,
}: {
  comment: Comment;
  onLike: () => void;
}) {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentRow}>
        <View style={styles.commentContent}>
          {/* Name and timestamp */}
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>{comment.time}</Text>
            <Text style={styles.commentName}>{comment.name}</Text>
          </View>

          {/* Comment text */}
          <Text style={styles.commentText}>{comment.text}</Text>

          {/* Like button */}
          <Pressable style={styles.likeButton} onPress={onLike} hitSlop={8}>
            <Text style={styles.likeCount}>
              {comment.likes}
            </Text>
            <Text
              style={[
                styles.likeIcon,
                comment.liked && styles.likeIconActive,
              ]}>
              {comment.liked ? '\u2665' : '\u2661'}
            </Text>
          </Pressable>
        </View>

        <Avatar name={comment.name} size={32} />
      </View>
    </View>
  );
}

/** Empty state when no comments */
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDCAC'}</Text>
      <Text style={styles.emptyTitle}>
        {'\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0628\u0639\u062F'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {'\u0643\u0646 \u0623\u0648\u0644 \u0645\u0646 \u064A\u0639\u0644\u0642'}
      </Text>
    </View>
  );
}

/** Sticky comment input at the bottom */
function CommentInput({
  value,
  onChangeText,
  onSend,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}) {
  return (
    <View style={styles.inputContainer}>
      <Pressable
        style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!value.trim()}>
        <Text style={styles.sendIcon}>{'\u2191'}</Text>
      </Pressable>
      <TextInput
        style={styles.textInput}
        placeholder={
          '\u0623\u0636\u0641 \u062A\u0639\u0644\u064A\u0642\u0627\u064B...'
        }
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChangeText}
        textAlign="right"
      />
      <Avatar
        name={'\u0623'}
        size={28}
      />
    </View>
  );
}

const ItemDivider = () => <View style={styles.divider} />;

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CommentsScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [inputText, setInputText] = useState('');
  const showEmpty = comments.length === 0;

  const dismiss = () => navigation.goBack();

  const handleLike = (id: string) => {
    setComments(prev =>
      prev.map(c =>
        c.id === id
          ? {...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1}
          : c,
      ),
    );
  };

  const handleSend = () => {
    if (!inputText.trim()) {
      return;
    }
    const newComment: Comment = {
      id: String(Date.now()),
      name: '\u0623\u0646\u062A',
      text: inputText.trim(),
      likes: 0,
      time: '\u0627\u0644\u0622\u0646',
      liked: false,
    };
    setComments(prev => [newComment, ...prev]);
    setInputText('');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Semi-transparent overlay — tapping dismisses */}
      <Pressable style={styles.overlay} onPress={dismiss} />

      {/* Bottom sheet */}
      <View
        style={[
          styles.sheet,
          {height: SHEET_HEIGHT, paddingBottom: insets.bottom},
        ]}>
        <DragHandle />
        <SheetHeader count={comments.length} onClose={dismiss} />

        {/* Comment list or empty state */}
        {showEmpty ? (
          <EmptyState />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <CommentItem comment={item} onLike={() => handleLike(item.id)} />
            )}
            ItemSeparatorComponent={ItemDivider}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Sticky comment input */}
        <CommentInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  /* ---- Sheet container ---- */
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  },

  /* ---- Drag handle ---- */
  dragHandleWrapper: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  headerCount: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 12,
    color: colors.text,
  },
  headerSpacer: {
    width: 28,
  },

  /* ---- Comment list ---- */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* ---- Comment item ---- */
  commentItem: {
    paddingVertical: spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    marginEnd: spacing.md,
    alignItems: 'flex-start',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  commentName: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    writingDirection: 'rtl',
  },
  commentTime: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },
  commentText: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeIcon: {
    fontSize: 14,
    color: colors.textDim,
  },
  likeIconActive: {
    color: colors.cta,
  },
  likeCount: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
  },

  /* ---- Avatar ---- */
  avatar: {
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text,
    fontWeight: fontWeights.semibold,
  },

  /* ---- Empty state ---- */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textDim,
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSizes.caption,
    color: colors.textDim,
    writingDirection: 'rtl',
  },

  /* ---- Comment input ---- */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    writingDirection: 'rtl',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 16,
    color: colors.text,
    fontWeight: fontWeights.bold,
  },
});
