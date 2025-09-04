import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign, TrendingUp, Percent, Activity } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';

export function StatsOverview() {
  const { allProjects, calculateStats } = useProjects();

  const activeProjects = allProjects.filter(p => !p.isCompleted);

  const totalStats = allProjects.reduce((acc, project) => {
    const stats = calculateStats(project);
    return {
      revenue: acc.revenue + stats.totalRevenue,
      expenses: acc.expenses + stats.totalExpenses,
      profit: acc.profit + stats.profit,
    };
  }, { revenue: 0, expenses: 0, profit: 0 });

  const avgProfitMargin = totalStats.revenue > 0 
    ? (totalStats.profit / totalStats.revenue) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Activity size={20} color={theme.colors.secondary} />
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <Text style={styles.statValue}>{activeProjects.length}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <DollarSign size={20} color={theme.colors.success} />
            <Text style={styles.statLabel}>Total Profit</Text>
          </View>
          <Text style={[
            styles.statValue,
            totalStats.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {formatCurrency(totalStats.profit)}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <TrendingUp size={20} color={theme.colors.secondary} />
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalStats.revenue)}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Percent size={20} color={theme.colors.secondary} />
            <Text style={styles.statLabel}>Avg Margin</Text>
          </View>
          <Text style={[
            styles.statValue,
            avgProfitMargin >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {avgProfitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 90,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    flexWrap: 'nowrap',
    width: '100%',
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'left',
    flexShrink: 0,
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
  },
  profitPositive: {
    color: theme.colors.success,
  },
  profitNegative: {
    color: theme.colors.error,
  },
});