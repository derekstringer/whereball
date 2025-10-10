/**
 * Services Bottom Sheet
 * Shows all available services for a game with deep-link actions
 * Industry-standard Modal + Pressable pattern
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  PanResponder,
} from 'react-native';
import { STREAMING_SERVICES, SERVICE_BRAND_COLORS } from '../../constants/services';

interface ServicesBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  userServices: string[];
  missingServices: string[];
  onServicePress: (serviceCode: string) => void;
  channel?: string; // e.g., "ESPN", "TNT"
}

export const ServicesBottomSheet: React.FC<ServicesBottomSheetProps> = ({
  visible,
  onClose,
  userServices,
  missingServices,
  onServicePress,
  channel,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - gestureState.dy / 400);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Available Services</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Your Services */}
              {userServices.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {channel ? `Watch on ${channel}` : 'Your Services'}
                  </Text>
                  {userServices.map((serviceCode) => {
                    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
                    if (!service) return null;
                    
                    const brandColor = SERVICE_BRAND_COLORS[serviceCode] || '#0066CC';
                    
                    return (
                      <TouchableOpacity
                        key={serviceCode}
                        style={styles.serviceRow}
                        onPress={() => onServicePress(serviceCode)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.serviceBadge, { backgroundColor: brandColor }]}>
                          <Text style={styles.serviceBadgeText}>{service.name}</Text>
                        </View>
                        <Text style={styles.arrowText}>→</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Other Services */}
              {missingServices.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {userServices.length > 0 ? 'Also Available On' : 'Available On'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    You don't have these services
                  </Text>
                  {missingServices.map((serviceCode) => {
                    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
                    if (!service) return null;
                    
                    return (
                      <View key={serviceCode} style={styles.serviceRowDisabled}>
                        <View style={styles.serviceBadgeDisabled}>
                          <Text style={styles.serviceBadgeTextDisabled}>{service.name}</Text>
                        </View>
                        <Text style={styles.disabledNote}>Not on your services</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {userServices.length === 0 && missingServices.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No streaming services carry this game
                  </Text>
                </View>
              )}

              {/* Legal Disclaimer */}
              <View style={styles.legalFooter}>
                <Text style={styles.legalText}>
                  Team and service names used for identification only. Not affiliated with or endorsed by any league or provider.
                </Text>
              </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  safeArea: {
    maxHeight: '100%',
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
  },
  scrollView: {
    flexGrow: 0,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceRowDisabled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    opacity: 0.6,
  },
  serviceBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0066CC',
    borderRadius: 20,
  },
  serviceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  serviceBadgeDisabled: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
  serviceBadgeTextDisabled: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999999',
  },
  disabledNote: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  arrowText: {
    fontSize: 20,
    color: '#0066CC',
    marginLeft: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
  },
  legalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
