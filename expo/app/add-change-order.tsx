import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Save, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';

export default function AddChangeOrderScreen() {
  const { projectId } = useLocalSearchParams();
  const router = useRouter();
  const { addChangeOrder } = useProjects();
  
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [approved, setApproved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for the change order.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      addChangeOrder(projectId as string, {
        description: description.trim(),
        amount: amountNum,
        approved,
      });
      
      Alert.alert('Success', 'Change order added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding change order:', error);
      Alert.alert('Error', 'Failed to add change order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (description.trim() || amount.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Add Change Order',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontWeight: '600' as const },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the change order..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Approved</Text>
              <Text style={styles.switchDescription}>
                Mark as approved to include in revenue calculations
              </Text>
            </View>
            <Switch
              value={approved}
              onValueChange={setApproved}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={approved ? theme.colors.primary : theme.colors.textLight}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Save size={20} color={theme.colors.primary} />
            <Text style={[styles.buttonText, styles.saveButtonText]}>
              {isSubmitting ? 'Saving...' : 'Save Change Order'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <X size={20} color={theme.colors.error} />
            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  form: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  actions: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    color: theme.colors.error,
  },
});