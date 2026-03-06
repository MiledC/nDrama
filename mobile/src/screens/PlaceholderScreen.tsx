import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme';

interface Props {
  name: string;
}

export default function PlaceholderScreen({name}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 18,
  },
});
