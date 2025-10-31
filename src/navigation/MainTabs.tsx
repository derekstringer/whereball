/**
 * Main Bottom Tabs Navigation
 * 5-tab navigation with elevated center "Just Ask" button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Heart, Search, MessageCircle, Bell, User } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/appStore';

// Screens
import { MyTeamsScreen } from '../screens/home/MyTeamsScreen';
import { ExploreScreen } from '../screens/home/ExploreScreen';
import { JustAskScreen } from '../screens/home/JustAskScreen';
import { MyRemindersScreen } from '../screens/home/MyRemindersScreen';
import { MyProfileScreen } from '../screens/home/MyProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabs: React.FC = () => {
  const { colors } = useTheme();
  const { alerts } = useAppStore();
  
  // Count pending reminders for badge
  const reminderCount = alerts.filter(a => a.status === 'pending').length;
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#222222',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 65, // Extra height for iOS safe area
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00d9ff', // Cyan
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. My Teams */}
      <Tab.Screen
        name="MyTeams"
        component={MyTeamsScreen}
        options={{
          tabBarLabel: 'My Teams',
          tabBarIcon: ({ color, size }) => (
            <Heart size={24} color={color} strokeWidth={2} fill={color === '#00d9ff' ? color : 'none'} />
          ),
        }}
      />
      
      {/* 2. Explore */}
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => (
            <Search size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      
      {/* 3. Just Ask (Center, Elevated Icon) */}
      <Tab.Screen
        name="JustAsk"
        component={JustAskScreen}
        options={{
          tabBarLabel: 'Just Ask',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerButtonContainer, { marginTop: -35 }]}>
              <View style={styles.centerButtonOutline}>
                <MessageCircle size={31} color="#00d9ff" strokeWidth={0} fill="#00d9ff" />
              </View>
            </View>
          ),
        }}
      />
      
      {/* 4. Reminders */}
      <Tab.Screen
        name="MyReminders"
        component={MyRemindersScreen}
        options={{
          tabBarLabel: 'Reminders',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Bell size={24} color={color} strokeWidth={2} />
              {reminderCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{reminderCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      
      {/* 5. My Profile */}
      <Tab.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{
          tabBarLabel: 'My Profile',
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonOutline: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00d9ff',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
