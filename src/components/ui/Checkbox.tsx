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
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <View style={styles.checkmark} />}
      </View>
      <Text style={styles.label}>{label}</Text>
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
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
});
