import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Plus, CheckCircle, RotateCcw, Trash2, Edit3,
  DollarSign, TrendingUp, Percent, Calendar, FileText, 
  ClipboardList, Check, X 
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { Expense } from '@/types/project';
import { generateProjectPDF } from '@/utils/pdfGenerator';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { allProjects, completeProject, reopenProject, deleteProject, deleteExpense, deleteChangeOrder, updateChangeOrder, calculateStats } = useProjects();
  
  const project = allProjects.find(p => p.id === id);

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = calculateStats(project);

  const handleComplete = () => {
    Alert.alert(
      'Complete Project',
      'Mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeProject(project.id);
            Alert.alert('Success', 'Project marked as completed');
          },
        },
      ]
    );
  };

  const handleReopen = () => {
    reopenProject(project.id);
    Alert.alert('Success', 'Project reopened');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddExpense = () => {
    router.push({
      pathname: '/add-expense',
      params: { projectId: project.id }
    });
  };

  const handleEditExpense = (expenseId: string) => {
    router.push({
      pathname: '/edit-expense',
      params: { projectId: project.id, expenseId }
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(project.id, expenseId),
        },
      ]
    );
  };

  const handleGeneratePDF = async () => {
    try {
      await generateProjectPDF(project, stats);
      Alert.alert('Success', 'PDF report generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    }
  };

  const handleEditProject = () => {
    router.push({
      pathname: '/edit-project',
      params: { id: project.id }
    });
  };

  const handleAddChangeOrder = () => {
    router.push({
      pathname: '/add-change-order',
      params: { projectId: project.id }
    });
  };

  const handleToggleChangeOrderApproval = (changeOrderId: string, currentApproval: boolean) => {
    updateChangeOrder(project.id, changeOrderId, { approved: !currentApproval });
  };

  const handleDeleteChangeOrder = (changeOrderId: string) => {
    Alert.alert(
      'Delete Change Order',
      'Are you sure you want to delete this change order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChangeOrder(project.id, changeOrderId),
        },
      ]
    );
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

  const groupedExpenses = project.expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        {project.address && (
          <Text style={styles.address}>{project.address}</Text>
        )}
        <View style={styles.dateRow}>
          <Calendar size={16} color={theme.colors.textLight} />
          <Text style={styles.date}>Project start: {formatDate(project.projectStartDate)}</Text>
        </View>
        {project.isCompleted && project.completedAt && (
          <View style={styles.completedBadge}>
            <CheckCircle size={16} color={theme.colors.success} />
            <Text style={styles.completedText}>
              Completed: {formatDate(project.completedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <DollarSign size={20} color={theme.colors.secondary} />
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
        </View>

        <View style={styles.statCard}>
          <ClipboardList size={20} color={theme.colors.success} />
          <Text style={styles.statLabel}>Change Orders</Text>
          <Text style={[styles.statValue, styles.profitPositive]}>
            {formatCurrency(stats.totalChangeOrders)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <DollarSign size={20} color={theme.colors.error} />
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, styles.expenseValue]}>
            {formatCurrency(stats.totalExpenses)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={20} color={stats.profit >= 0 ? theme.colors.success : theme.colors.error} />
          <Text style={styles.statLabel}>Profit</Text>
          <Text style={[
            styles.statValue,
            stats.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {formatCurrency(stats.profit)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Percent size={20} color={theme.colors.secondary} />
          <Text style={styles.statLabel}>Margin</Text>
          <Text style={[
            styles.statValue,
            stats.profitMargin >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {stats.profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.laborStats}>
        <Text style={styles.laborLabel}>Labor Percentage:</Text>
        <Text style={styles.laborValue}>{stats.laborPercentage.toFixed(1)}%</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.pdfButton]} onPress={handleGeneratePDF}>
          <FileText size={20} color={theme.colors.primary} />
          <Text style={[styles.actionButtonText, styles.pdfButtonText]}>Generate PDF Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditProject}>
          <Edit3 size={20} color={theme.colors.primary} />
          <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit Project</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.changeOrderButton]} onPress={handleAddChangeOrder}>
          <ClipboardList size={20} color={theme.colors.success} />
          <Text style={[styles.actionButtonText, styles.changeOrderButtonText]}>Change Orders</Text>
        </TouchableOpacity>

        {!project.isCompleted ? (
          <TouchableOpacity style={styles.actionButton} onPress={handleComplete}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={styles.actionButtonText}>Complete Project</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={handleReopen}>
            <RotateCcw size={20} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Reopen Project</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionButton, styles.projectDeleteButton]} onPress={handleDelete}>
          <Trash2 size={20} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, styles.projectDeleteButtonText]}>Delete Project</Text>
        </TouchableOpacity>
      </View>

      {(project.changeOrders && project.changeOrders.length > 0) && (
        <View style={styles.changeOrdersSection}>
          <Text style={styles.sectionTitle}>Change Orders</Text>
          {project.changeOrders.map(changeOrder => (
            <View key={changeOrder.id} style={styles.changeOrderItem}>
              <View style={styles.changeOrderInfo}>
                <Text style={styles.changeOrderDescription}>{changeOrder.description}</Text>
                <Text style={styles.changeOrderDate}>{formatDate(changeOrder.date)}</Text>
                <View style={styles.changeOrderStatus}>
                  {changeOrder.approved ? (
                    <View style={styles.approvedBadge}>
                      <Check size={14} color={theme.colors.success} />
                      <Text style={styles.approvedText}>Approved</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <X size={14} color={theme.colors.warning} />
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.changeOrderRight}>
                <Text style={[styles.changeOrderAmount, changeOrder.approved && styles.profitPositive]}>
                  {formatCurrency(changeOrder.amount)}
                </Text>
                <View style={styles.changeOrderActions}>
                  <TouchableOpacity 
                    style={[styles.approvalButton, changeOrder.approved && styles.approvedButton]}
                    onPress={() => handleToggleChangeOrderApproval(changeOrder.id, changeOrder.approved)}
                  >
                    {changeOrder.approved ? (
                      <X size={14} color={theme.colors.warning} />
                    ) : (
                      <Check size={14} color={theme.colors.success} />
                    )}
                    <Text style={[styles.approvalButtonText, changeOrder.approved && styles.approvedButtonText]}>
                      {changeOrder.approved ? 'Unapprove' : 'Approve'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteChangeOrder(changeOrder.id)}
                  >
                    <Trash2 size={14} color={theme.colors.error} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.expensesSection}>
        <View style={styles.expensesHeader}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
            <Plus size={20} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(groupedExpenses).map(([category, expenses]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {expenses.map(expense => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseSubcategory}>{expense.subcategory}</Text>
                  {expense.description && (
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                  )}
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                  <View style={styles.expenseActions}>
                    <TouchableOpacity 
                      style={styles.expenseEditButton}
                      onPress={() => handleEditExpense(expense.id)}
                    >
                      <Edit3 size={16} color={theme.colors.secondary} />
                      <Text style={styles.expenseEditButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 size={16} color={theme.colors.error} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {project.expenses.length === 0 && (
          <View style={styles.emptyExpenses}>
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
            <Text style={styles.emptySubtext}>Tap the Add button to record an expense</Text>
          </View>
        )}
      </View>

      {project.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{project.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  backLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  address: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  completedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  expenseValue: {
    color: theme.colors.error,
  },
  profitPositive: {
    color: theme.colors.success,
  },
  profitNegative: {
    color: theme.colors.error,
  },
  laborStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  laborLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  laborValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  actionsContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
  },
  projectDeleteButton: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  projectDeleteButtonText: {
    color: theme.colors.error,
  },
  pdfButton: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pdfButtonText: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  editButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  changeOrderButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  changeOrderButtonText: {
    color: theme.colors.success,
    fontWeight: '600' as const,
  },
  changeOrdersSection: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  changeOrderItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  changeOrderInfo: {
    flex: 1,
  },
  changeOrderDescription: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  changeOrderDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  changeOrderStatus: {
    marginTop: theme.spacing.xs,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  approvedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: '500' as const,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pendingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: '500' as const,
  },
  changeOrderRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  changeOrderAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.textLight,
  },
  changeOrderActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approvalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  approvedButton: {
    borderColor: theme.colors.warning,
  },
  approvalButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500' as const,
    color: theme.colors.success,
  },
  approvedButtonText: {
    color: theme.colors.warning,
  },
  expensesSection: {
    padding: theme.spacing.lg,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  categorySection: {
    marginBottom: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseSubcategory: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
  },
  expenseDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  expenseDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  expenseAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.error,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  expenseEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  expenseEditButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500' as const,
    color: theme.colors.error,
  },
  emptyExpenses: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  notesSection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  notesText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
});