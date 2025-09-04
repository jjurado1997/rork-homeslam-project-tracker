import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useProjects } from '@/hooks/project-store';
import { theme } from '@/constants/theme';
import { DollarSign, TrendingUp, Calendar, Building2 } from 'lucide-react-native';
import { Project } from '@/types/project';

interface RevenueStats {
  totalRevenue: number;
  totalChangeOrders: number;
  projectCount: number;
  averageRevenue: number;
}

interface ClientRevenue {
  client: string;
  revenue: number;
  changeOrders: number;
  projectCount: number;
  totalRevenue: number;
}

export default function RevenueScreen() {
  const { allProjects } = useProjects();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const filteredProjects = useMemo(() => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let filtered = (allProjects || []).filter(p => {
        // Ensure project has required properties and valid dates
        try {
          return p && 
                 p.projectStartDate && 
                 p.projectStartDate instanceof Date &&
                 !isNaN(p.projectStartDate.getTime()) &&
                 typeof p.totalRevenue === 'number' &&
                 !isNaN(p.totalRevenue);
        } catch (error) {
          console.warn('Invalid project in revenue filter:', p?.name, error);
          return false;
        }
      });

      switch (selectedPeriod) {
      case 'daily':
        filtered = filtered.filter(p => {
          try {
            const projectDate = new Date(p.projectStartDate);
            projectDate.setHours(0, 0, 0, 0);
            const todayStart = new Date(startOfDay);
            todayStart.setHours(0, 0, 0, 0);
            return projectDate.getTime() === todayStart.getTime();
          } catch (error) {
            console.error('Error filtering daily projects:', error, p.name);
            return false;
          }
        });
        break;
      case 'weekly':
        filtered = filtered.filter(p => {
          try {
            return new Date(p.projectStartDate) >= startOfWeek;
          } catch (error) {
            console.error('Error filtering weekly projects:', error, p.name);
            return false;
          }
        });
        break;
      case 'monthly':
        filtered = filtered.filter(p => {
          try {
            return new Date(p.projectStartDate) >= startOfMonth;
          } catch (error) {
            console.error('Error filtering monthly projects:', error, p.name);
            return false;
          }
        });
        break;
      }

      return filtered.sort((a, b) => {
        try {
          return new Date(b.projectStartDate).getTime() - new Date(a.projectStartDate).getTime();
        } catch (error) {
          console.error('Error sorting projects:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error in filteredProjects:', error);
      return [];
    }
  }, [allProjects, selectedPeriod]);

  const revenueStats = useMemo((): RevenueStats => {
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalChangeOrders = filteredProjects.reduce((sum, p) => {
      return sum + (p.changeOrders || []).filter(co => co.approved).reduce((coSum, co) => coSum + co.amount, 0);
    }, 0);
    const projectCount = filteredProjects.length;
    const averageRevenue = projectCount > 0 ? (totalRevenue + totalChangeOrders) / projectCount : 0;

    return {
      totalRevenue,
      totalChangeOrders,
      projectCount,
      averageRevenue,
    };
  }, [filteredProjects]);

  const clientRevenueData = useMemo((): ClientRevenue[] => {
    const clientMap = new Map<string, ClientRevenue>();

    filteredProjects.forEach(project => {
      const client = project.client;
      const changeOrdersTotal = (project.changeOrders || [])
        .filter(co => co.approved)
        .reduce((sum, co) => sum + co.amount, 0);
      
      if (clientMap.has(client)) {
        const existing = clientMap.get(client)!;
        existing.revenue += project.totalRevenue;
        existing.changeOrders += changeOrdersTotal;
        existing.projectCount += 1;
        existing.totalRevenue = existing.revenue + existing.changeOrders;
      } else {
        clientMap.set(client, {
          client,
          revenue: project.totalRevenue,
          changeOrders: changeOrdersTotal,
          projectCount: 1,
          totalRevenue: project.totalRevenue + changeOrdersTotal,
        });
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
    }
  };

  const renderClientItem = ({ item }: { item: ClientRevenue }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <Building2 size={20} color={theme.colors.secondary} />
        <Text style={styles.clientName}>{item.client}</Text>
      </View>
      <View style={styles.clientStats}>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Base Revenue</Text>
          <Text style={styles.clientStatValue}>{formatCurrency(item.revenue)}</Text>
        </View>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Change Orders</Text>
          <Text style={styles.clientStatValue}>{formatCurrency(item.changeOrders)}</Text>
        </View>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Total Revenue</Text>
          <Text style={[styles.clientStatValue, styles.totalRevenue]}>{formatCurrency(item.totalRevenue)}</Text>
        </View>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Projects</Text>
          <Text style={styles.clientStatValue}>{item.projectCount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Revenue Period</Text>
        <View style={styles.filterButtons}>
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterButton,
                selectedPeriod === period && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedPeriod === period && styles.filterButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Revenue Overview */}
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Revenue Overview - {getPeriodLabel()}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <DollarSign size={24} color={theme.colors.secondary} />
            <Text style={styles.statValue}>{formatCurrency(revenueStats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Base Revenue</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color={theme.colors.accent} />
            <Text style={styles.statValue}>{formatCurrency(revenueStats.totalChangeOrders)}</Text>
            <Text style={styles.statLabel}>Change Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{revenueStats.projectCount}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          
          <View style={styles.statCard}>
            <DollarSign size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>{formatCurrency(revenueStats.averageRevenue)}</Text>
            <Text style={styles.statLabel}>Avg per Project</Text>
          </View>
        </View>

        <View style={styles.totalRevenueCard}>
          <Text style={styles.totalRevenueLabel}>Total Revenue ({getPeriodLabel()})</Text>
          <Text style={styles.totalRevenueValue}>
            {formatCurrency(revenueStats.totalRevenue + revenueStats.totalChangeOrders)}
          </Text>
        </View>
      </View>

      {/* Client Revenue Breakdown */}
      <View style={styles.clientsContainer}>
        <Text style={styles.sectionTitle}>Revenue by Client</Text>
        {clientRevenueData.length > 0 ? (
          <FlatList
            data={clientRevenueData}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.client}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={theme.colors.textLight} />
            <Text style={styles.emptyStateText}>No revenue data for {getPeriodLabel().toLowerCase()}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  filterButtonTextActive: {
    color: theme.colors.surface,
  },
  overviewContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  totalRevenueCard: {
    backgroundColor: theme.colors.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalRevenueLabel: {
    fontSize: 16,
    color: theme.colors.surface,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  totalRevenueValue: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: theme.colors.surface,
  },
  clientsContainer: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginLeft: 8,
  },
  clientStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  clientStat: {
    flex: 1,
    minWidth: '45%',
  },
  clientStatLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  clientStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  totalRevenue: {
    color: theme.colors.secondary,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
});