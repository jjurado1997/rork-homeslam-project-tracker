import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart3, TrendingUp, DollarSign, Percent, Calendar, Users } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { CLIENTS } from '@/types/project';

export default function AnalyticsScreen() {
  const { allProjects, calculateStats } = useProjects();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get start of current month
  const startOfMonth = new Date(currentYear, currentMonth, 1);

  const monthlyProjects = allProjects.filter(p => {
    const projectDate = new Date(p.projectStartDate);
    return projectDate >= startOfMonth;
  });

  const weeklyProjects = allProjects.filter(p => {
    const projectDate = new Date(p.projectStartDate);
    return projectDate >= startOfWeek;
  });

  const completedThisMonth = monthlyProjects.filter(p => p.isCompleted);
  const completedThisWeek = weeklyProjects.filter(p => p.isCompleted);

  const monthlyStats = monthlyProjects.reduce((acc, project) => {
    const stats = calculateStats(project);
    return {
      revenue: acc.revenue + stats.totalRevenue,
      expenses: acc.expenses + stats.totalExpenses,
      profit: acc.profit + stats.profit,
      projects: acc.projects + 1,
    };
  }, { revenue: 0, expenses: 0, profit: 0, projects: 0 });

  const weeklyStats = weeklyProjects.reduce((acc, project) => {
    const stats = calculateStats(project);
    return {
      revenue: acc.revenue + stats.totalRevenue,
      expenses: acc.expenses + stats.totalExpenses,
      profit: acc.profit + stats.profit,
      projects: acc.projects + 1,
    };
  }, { revenue: 0, expenses: 0, profit: 0, projects: 0 });

  const avgProjectValue = monthlyStats.projects > 0 
    ? monthlyStats.revenue / monthlyStats.projects 
    : 0;

  const weeklyAvgProjectValue = weeklyStats.projects > 0 
    ? weeklyStats.revenue / weeklyStats.projects 
    : 0;

  const profitMargin = monthlyStats.revenue > 0 
    ? (monthlyStats.profit / monthlyStats.revenue) * 100 
    : 0;

  const weeklyProfitMargin = weeklyStats.revenue > 0 
    ? (weeklyStats.profit / weeklyStats.revenue) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const categoryBreakdown = allProjects.reduce((acc, project) => {
    project.expenses.forEach(expense => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Overview</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        <Text style={styles.sectionSubtitle}>
          Week of {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <DollarSign size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>{formatCurrency(weeklyStats.revenue)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.statLabel}>Profit</Text>
              <Text style={[
                styles.statValue,
                weeklyStats.profit >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {formatCurrency(weeklyStats.profit)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Percent size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Margin</Text>
              <Text style={[
                styles.statValue,
                weeklyProfitMargin >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {weeklyProfitMargin.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Projects</Text>
              <Text style={styles.statValue}>{weeklyStats.projects}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <Text style={styles.sectionSubtitle}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <DollarSign size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>{formatCurrency(monthlyStats.revenue)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.statLabel}>Profit</Text>
              <Text style={[
                styles.statValue,
                monthlyStats.profit >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {formatCurrency(monthlyStats.profit)}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Percent size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Margin</Text>
              <Text style={[
                styles.statValue,
                profitMargin >= 0 ? styles.profitPositive : styles.profitNegative
              ]}>
                {profitMargin.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Projects</Text>
              <Text style={styles.statValue}>{monthlyStats.projects}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricsColumn}>
            <Text style={styles.metricsColumnTitle}>Weekly</Text>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Project Value</Text>
              <Text style={styles.metricValue}>{formatCurrency(weeklyAvgProjectValue)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Completed Projects</Text>
              <Text style={styles.metricValue}>
                {completedThisWeek.length} / {weeklyProjects.length}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Expenses</Text>
              <Text style={[styles.metricValue, styles.expenseValue]}>
                {formatCurrency(weeklyStats.expenses)}
              </Text>
            </View>
          </View>

          <View style={styles.metricsColumn}>
            <Text style={styles.metricsColumnTitle}>Monthly</Text>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Project Value</Text>
              <Text style={styles.metricValue}>{formatCurrency(avgProjectValue)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Completed Projects</Text>
              <Text style={styles.metricValue}>
                {completedThisMonth.length} / {monthlyProjects.length}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Expenses</Text>
              <Text style={[styles.metricValue, styles.expenseValue]}>
                {formatCurrency(monthlyStats.expenses)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        
        {Object.entries(categoryBreakdown).map(([category, amount]) => (
          <View key={category} style={styles.categoryRow}>
            <Text style={styles.categoryName}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
          </View>
        ))}
        
        {Object.keys(categoryBreakdown).length === 0 && (
          <Text style={styles.noData}>No expenses recorded yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Performance</Text>
        
        {CLIENTS.map(client => {
          const clientProjects = allProjects.filter(p => p.client === client);
          const clientStats = clientProjects.reduce((acc, project) => {
            const stats = calculateStats(project);
            return {
              revenue: acc.revenue + stats.totalRevenue,
              profit: acc.profit + stats.profit,
              projects: acc.projects + 1,
            };
          }, { revenue: 0, profit: 0, projects: 0 });

          if (clientStats.projects === 0) return null;

          const clientAvgProjectValue = clientStats.revenue / clientStats.projects;
          const clientProfitMargin = clientStats.revenue > 0 ? (clientStats.profit / clientStats.revenue) * 100 : 0;

          return (
            <View key={client} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <Users size={16} color={theme.colors.secondary} />
                <Text style={styles.clientName}>{client}</Text>
              </View>
              <View style={styles.clientStats}>
                <View style={styles.clientStat}>
                  <Text style={styles.clientStatLabel}>Projects</Text>
                  <Text style={styles.clientStatValue}>{clientStats.projects}</Text>
                </View>
                <View style={styles.clientStat}>
                  <Text style={styles.clientStatLabel}>Revenue</Text>
                  <Text style={styles.clientStatValue}>{formatCurrency(clientStats.revenue)}</Text>
                </View>
                <View style={styles.clientStat}>
                  <Text style={styles.clientStatLabel}>Profit</Text>
                  <Text style={[
                    styles.clientStatValue,
                    clientStats.profit >= 0 ? styles.profitPositive : styles.profitNegative
                  ]}>
                    {formatCurrency(clientStats.profit)}
                  </Text>
                </View>
              </View>
              <View style={styles.clientMetrics}>
                <View style={styles.clientMetricRow}>
                  <Text style={styles.clientMetricLabel}>Avg Project:</Text>
                  <Text style={styles.clientMetricValue}>{formatCurrency(clientAvgProjectValue)}</Text>
                </View>
                <View style={styles.clientMetricRow}>
                  <Text style={styles.clientMetricLabel}>Margin:</Text>
                  <Text style={[
                    styles.clientMetricValue,
                    clientProfitMargin >= 0 ? styles.profitPositive : styles.profitNegative
                  ]}>
                    {clientProfitMargin.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold' as const,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    padding: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    textAlign: 'center',
    width: '100%',
  },
  profitPositive: {
    color: theme.colors.success,
  },
  profitNegative: {
    color: theme.colors.error,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  metricValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  expenseValue: {
    color: theme.colors.error,
  },
  categoryRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  categoryAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.textLight,
  },
  noData: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  clientCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  clientName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  clientStat: {
    alignItems: 'center',
  },
  clientStatLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  clientStatValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  clientMetrics: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  clientMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientMetricLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    flex: 1,
  },
  clientMetricValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricsColumn: {
    flex: 1,
  },
  metricsColumnTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});