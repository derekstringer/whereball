/**
 * WhereBall Main App
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screens
import { SignInScreen } from './src/screens/onboarding/SignInScreen';
import { ZipEntryScreen } from './src/screens/onboarding/ZipEntryScreen';
import { ServicesSelectorScreen } from './src/screens/onboarding/ServicesSelectorScreen';
import { TeamPickerScreen } from './src/screens/onboarding/TeamPickerScreen';
import { MainTabs } from './src/navigation/MainTabs';

// Auth & Store
import { getCurrentUser, onAuthStateChange } from './src/lib/auth';
import { useAppStore } from './src/store/appStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setUser, setAuthenticated } = useAppStore();

  useEffect(() => {
    // Check auth state on mount
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
          zip: null,
          platform: null,
          marketing_opt_in: false,
          revenuecat_user_id: null,
        });
        setAuthenticated(true);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    
    if (user) {
      setUser({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
        zip: null,
        platform: null,
        marketing_opt_in: false,
        revenuecat_user_id: null,
      });
      setAuthenticated(true);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
          initialRouteName="ZipEntry"
        >
          {/* Onboarding Stack - Auth bypassed for demo */}
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="ZipEntry" component={ZipEntryScreen} />
          <Stack.Screen name="ServicesSelector" component={ServicesSelectorScreen} />
          <Stack.Screen name="TeamPicker" component={TeamPickerScreen} />
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{
              gestureEnabled: false, // Disable swipe back gesture
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
