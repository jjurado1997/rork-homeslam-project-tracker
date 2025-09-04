import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, Circle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Project } from '@/types/project';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { calculateStats } = useProjects();
  const stats = calculateStats(project);

  const handlePress = () => {
    router.push(`/project/${project.id}`);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {project.isCompleted ? (
            <CheckCircle size={20} color={theme.colors.success} />
          ) : (
            <Circle size={20} color={theme.colors.secondary} />
          )}
          <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
        </View>
        <Text style={styles.date}>Project start: {formatDate(project.projectStartDate)}</Text>
      </View>

      <View style={styles.infoRow}>
        {project.address && (
          <Text style={styles.address} numberOfLines={1}>{project.address}</Text>
        )}
        <Text style={styles.client}>{project.client}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <DollarSign size={16} color={theme.colors.revenue} />
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={[styles.statValue, styles.revenueValue]}>{formatCurrency(stats.totalRevenue)}</Text>
          </View>
          <View style={styles.stat}>
            <DollarSign size={16} color={theme.colors.expense} />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, styles.expenseValue]}>
              {formatCurrency(stats.totalExpenses)}
            </Text>
          </View>
        </View>

        <View style={styles.profitContainer}>
          <View style={styles.profitRow}>
            {stats.profit >= 0 ? (
              <TrendingUp size={20} color={theme.colors.profit} />
            ) : (
              <TrendingDown size={20} color={theme.colors.loss} />
            )}
            <Text style={styles.profitLabel}>Profit</Text>
            <Text style={[
              styles.profitValue,
              stats.profit >= 0 ? styles.profitPositive : styles.profitNegative
            ]}>
              {formatCurrency(stats.profit)}
            </Text>
          </View>
          <Text style={[
            styles.profitMargin,
            stats.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {stats.profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>

      {project.isCompleted && project.completedAt && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>
            Completed {formatDate(project.completedAt)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
    minWidth: 0,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    flexShrink: 0,
    minWidth: 120,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
    marginLeft: 28,
    gap: theme.spacing.xs,
  },
  address: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  client: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
    fontWeight: '500' as const,
  },
  statsContainer: {
    gap: theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    minWidth: 100,
    paddingHorizontal: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    flexShrink: 0,
    minWidth: 60,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  revenueValue: {
    color: theme.colors.revenue,
  },
  expenseValue: {
    color: theme.colors.expense,
  },
  profitContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    flexWrap: 'nowrap',
    minWidth: 0,
  },
  profitLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    flexShrink: 0,
    minWidth: 50,
  },
  profitValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
  },
  profitMargin: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
  },
  profitPositive: {
    color: theme.colors.profit,
  },
  profitNegative: {
    color: theme.colors.loss,
  },
  completedBadge: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  completedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    textAlign: 'center',
  },
});