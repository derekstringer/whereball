/**
 * Services Bottom Sheet
 * Shows all available services for a game with deep-link actions
 * Industry-standard Modal + Pressable pattern
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView style={styles.safeArea}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Available Services</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
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
                      <Pressable
                        key={serviceCode}
                        style={({pressed}) => [
                          styles.serviceRow,
                          pressed && styles.serviceRowPressed
                        ]}
                        onPress={() => onServicePress(serviceCode)}
                      >
                        <View style={[styles.serviceBadge, { backgroundColor: brandColor }]}>
                          <Text style={styles.serviceBadgeText}>{service.name}</Text>
                        </View>
                        <Text style={styles.arrowText}>→</Text>
                      </Pressable>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  safeArea: {
    maxHeight: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
  serviceRowPressed: {
    backgroundColor: '#F8F9FA',
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
