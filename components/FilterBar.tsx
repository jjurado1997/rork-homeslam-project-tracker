import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { CLIENTS } from '@/types/project';

export function FilterBar() {
  const { 
    selectedFilter, 
    setSelectedFilter, 
    selectedPeriod, 
    setSelectedPeriod,
    selectedClient,
    setSelectedClient 
  } = useProjects();

  const filters = [
    { value: 'active' as const, label: 'Active' },
    { value: 'completed' as const, label: 'Completed' },
    { value: 'all' as const, label: 'All' },
  ];

  const periods = [
    { value: 'daily' as const, label: 'Daily' },
    { value: 'weekly' as const, label: 'Weekly' },
    { value: 'monthly' as const, label: 'Monthly' },
    { value: 'quarterly' as const, label: 'Quarterly' },
  ];

  const clients = [
    { value: 'all', label: 'All Clients' },
    ...CLIENTS.map(client => ({ value: client, label: client }))
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                selectedFilter === filter.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.value && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Period:</Text>
          {periods.map(period => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.filterButton,
                selectedPeriod === period.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedPeriod === period.value && styles.filterButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Client:</Text>
          {clients.map(client => (
            <TouchableOpacity
              key={client.value}
              style={[
                styles.filterButton,
                selectedClient === client.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedClient(client.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedClient === client.value && styles.filterButtonTextActive
              ]}>
                {client.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterRow: {
    paddingHorizontal: theme.spacing.md,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '600' as const,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center',
    flexShrink: 0,
    width: '100%',
  },
  filterButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
});