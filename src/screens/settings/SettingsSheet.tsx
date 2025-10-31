/**
 * SettingsSheet - Bottom sheet wrapper for Settings (matches FiltersSheetV2 presentation)
 * 85% height, drag handle, no X button
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, PanResponder, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SettingsScreen } from './SettingsScreen';
import type { NHLGame } from '../../lib/nhl-api';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  games?: NHLGame[];
  onNavigateToGame?: (gameId: string) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  visible,
  onClose,
  games = [],
  onNavigateToGame,
}) => {
  const { colors } = useTheme();

  // Drag gesture handling
  const panY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, { dy }) => {
        // Close if dragged down more than 100px
        if (dy > 100) {
          onClose();
        } else {
          // Snap back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Reset drag position when sheet opens
  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg },
            { transform: [{ translateY: panY }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header - DRAGGABLE for native iOS close gesture */}
            <View
              style={[
                styles.header,
                { backgroundColor: colors.bg, borderBottomColor: colors.border },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Drag Handle - visual indicator at top center */}
              <View style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
              </View>
              
              {/* Title - centered */}
              <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            </View>

            {/* Settings Content (without its own header since we have drag handle + title) */}
            <SettingsScreen onClose={onClose} isBottomSheet games={games} onNavigateToGame={onNavigateToGame} />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%', // Match FiltersSheetV2
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    zIndex: 100,
    position: 'relative',
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
});
