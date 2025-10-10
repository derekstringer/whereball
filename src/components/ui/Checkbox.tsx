/**
 * Checkbox Component
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  containerStyle?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onPress,
  containerStyle,
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        { 
          backgroundColor: checked ? colors.primary : colors.surface,
          borderColor: checked ? colors.primary : colors.border,
        }
      ]}>
        {checked && <View style={[styles.checkmark, { backgroundColor: colors.bg }]} />}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
});
