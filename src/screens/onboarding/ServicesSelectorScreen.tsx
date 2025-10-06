/**
 * Services Selector Screen - Onboarding Step 3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { STREAMING_SERVICES } from '../../constants/services';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/appStore';

interface ServicesSelectorScreenProps {
  navigation: any;
  route: any;
}

export const ServicesSelectorScreen: React.FC<ServicesSelectorScreenProps> = ({
  navigation,
  route,
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAppStore();
  const zip = route.params?.zip;

  const toggleService = (serviceCode: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceCode)
        ? prev.filter((code) => code !== serviceCode)
        : [...prev, serviceCode]
    );
  };

  const handleContinue = async () => {
    setLoading(true);

    try {
      // Save selected services to database
      if (user?.id && selectedServices.length > 0) {
        // Delete existing subscriptions
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        // Insert new subscriptions
        const subscriptions = selectedServices.map((serviceCode) => ({
          user_id: user.id,
          service_code: serviceCode,
        }));

        const { error } = await supabase
          .from('user_subscriptions')
          .insert(subscriptions);

        if (error) throw error;
      }

      // Navigate to team picker
      navigation.navigate('TeamPicker', {
        zip,
        services: selectedServices,
      });
    } catch (error: any) {
      console.error('Failed to save services:', error);
      alert('Failed to save services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.progress}>Step 2 of 3</Text>

          <Text style={styles.emoji}>📺</Text>
          <Text style={styles.title}>Pick your streaming services</Text>
          <Text style={styles.subtitle}>
            Select all the services you currently subscribe to. We'll show you which ones carry each game.
          </Text>

          <View style={styles.servicesContainer}>
            {STREAMING_SERVICES.map((service) => (
              <Checkbox
                key={service.code}
                label={service.name}
                checked={selectedServices.includes(service.code)}
                onPress={() => toggleService(service.code)}
              />
            ))}
          </View>

          <Button
            title={`Continue (${selectedServices.length} selected)`}
            onPress={handleContinue}
            loading={loading}
            disabled={loading || selectedServices.length === 0}
          />

          <Text style={styles.note}>
            💡 You can always change your services later in Settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  progress: {
    fontSize: 15,
    color: '#999999',
    fontWeight: '600',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  servicesContainer: {
    marginBottom: 32,
  },
  note: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
});
