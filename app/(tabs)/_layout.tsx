import { Tabs } from "expo-router";
import { Home, BarChart3, Settings } from "lucide-react-native";
import React from "react";
import { theme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: theme.colors.tabBackground,
          borderTopColor: theme.colors.secondary,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.colors.headerBackground,
        },
        headerTintColor: theme.colors.secondary,
        headerTitleStyle: {
          fontWeight: 'bold' as const,
        },
        headerTitle: 'Homeslam',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Projects",
          headerTitle: "Homeslam",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerTitle: "Homeslam",
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTitle: "Homeslam",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}