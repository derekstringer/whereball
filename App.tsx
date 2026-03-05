import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { PetDetailScreen } from './src/screens/PetDetailScreen';
import { MainTabs } from './src/navigation/MainTabs';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCurrentUser, onAuthStateChange } from './src/lib/auth';
import { useAppStore } from './src/store/appStore';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { setUser, setAuthenticated } = useAppStore();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const colorMode = useAppStore((s) => s.colorMode);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? '',
          display_name: null,
          default_location: null,
          default_radius: 25,
          created_at: user.created_at ?? new Date().toISOString(),
        });
        setAuthenticated(true);
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? '',
          display_name: null,
          default_location: null,
          default_radius: 25,
          created_at: user.created_at ?? new Date().toISOString(),
        });
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorMode === 'light' ? 'dark' : 'light'} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          >
            {/* Always allow browsing — auth is optional */}
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="PetDetail"
              component={PetDetailScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08080C',
  },
});
