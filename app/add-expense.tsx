import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Alert, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Save, ChevronDown } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { ExpenseCategory, EXPENSE_SUBCATEGORIES } from '@/types/project';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const { addExpense, allProjects } = useProjects();

  const project = allProjects.find(p => p.id === projectId);

  const [category, setCategory] = useState<ExpenseCategory>('materials');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);

  const categories: { value: ExpenseCategory; label: string }[] = [
    { value: 'materials', label: 'Materials' },
    { value: 'contractors', label: 'Contractors' },
    { value: 'labor', label: 'Labor' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'other', label: 'Other' },
  ];

  const handleSave = () => {
    if (!subcategory.trim()) {
      Alert.alert('Error', 'Please select a subcategory');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!projectId || typeof projectId !== 'string') {
      Alert.alert('Error', 'Invalid project');
      return;
    }

    addExpense(projectId, {
      category,
      subcategory: subcategory.trim(),
      amount: Number(amount),
      description: description.trim() || undefined,
    });

    Alert.alert('Success', 'Expense added successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    router.back();
  };

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.address && (
            <Text style={styles.projectAddress}>{project.address}</Text>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity 
              style={styles.picker}
              onPress={() => {
                setShowCategoryPicker(!showCategoryPicker);
                setShowSubcategoryPicker(false);
              }}
            >
              <Text style={styles.pickerText}>
                {categories.find(c => c.value === category)?.label}
              </Text>
              <ChevronDown size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          {showCategoryPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      setCategory(item.value);
                      setShowCategoryPicker(false);
                      setSubcategory('');
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subcategory *</Text>
            <TouchableOpacity 
              style={styles.picker}
              onPress={() => {
                setShowSubcategoryPicker(!showSubcategoryPicker);
                setShowCategoryPicker(false);
              }}
            >
              <Text style={[
                styles.pickerText,
                !subcategory && styles.pickerPlaceholder
              ]}>
                {subcategory || 'Select subcategory'}
              </Text>
              <ChevronDown size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          {showSubcategoryPicker && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {EXPENSE_SUBCATEGORIES[category].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSubcategory(item);
                      setShowSubcategoryPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add expense details..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <X size={20} color={theme.colors.text} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={theme.colors.primary} />
            <Text style={styles.saveButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  projectInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  projectName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  projectAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  form: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: theme.spacing.md,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  pickerPlaceholder: {
    color: theme.colors.textLight,
  },
  dropdownContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dropdownList: {
    maxHeight: 250,
  },
  pickerOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  pickerOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
});