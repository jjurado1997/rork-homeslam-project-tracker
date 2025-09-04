import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Save, ChevronDown, Calendar } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { CLIENTS } from '@/types/project';

export default function AddProjectScreen() {
  const router = useRouter();
  const { addProject } = useProjects();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState<string>(CLIENTS[0]);
  const [totalRevenue, setTotalRevenue] = useState('');
  const [projectStartDate, setProjectStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!totalRevenue.trim() || isNaN(Number(totalRevenue))) {
      Alert.alert('Error', 'Please enter a valid total revenue');
      return;
    }

    addProject({
      name: name.trim(),
      address: address.trim() || undefined,
      client,
      totalRevenue: Number(totalRevenue),
      projectStartDate,
      notes: notes.trim() || undefined,
    });

    Alert.alert('Success', 'Project created successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter project name"
              placeholderTextColor={theme.colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter property address"
              placeholderTextColor={theme.colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client/Company *</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowClientPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{client}</Text>
              <ChevronDown size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Start Date *</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={theme.colors.textLight} />
              <Text style={styles.pickerButtonText}>
                {projectStartDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Revenue (Quote Price) *</Text>
            <TextInput
              style={styles.input}
              value={totalRevenue}
              onChangeText={setTotalRevenue}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any project notes..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
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
            <Text style={styles.saveButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showClientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {CLIENTS.map((clientOption) => (
                <TouchableOpacity
                  key={clientOption}
                  style={[
                    styles.modalItem,
                    client === clientOption && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setClient(clientOption);
                    setShowClientPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    client === clientOption && styles.modalItemTextSelected
                  ]}>
                    {clientOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Start Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <ScrollView style={styles.datePickerColumn}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.datePickerItem,
                      projectStartDate.getDate() === day && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(projectStartDate);
                      newDate.setDate(day);
                      setProjectStartDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerText,
                      projectStartDate.getDate() === day && styles.datePickerTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.datePickerColumn}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.datePickerItem,
                      projectStartDate.getMonth() === index && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(projectStartDate);
                      newDate.setMonth(index);
                      setProjectStartDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerText,
                      projectStartDate.getMonth() === index && styles.datePickerTextSelected
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.datePickerColumn}>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.datePickerItem,
                      projectStartDate.getFullYear() === year && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(projectStartDate);
                      newDate.setFullYear(year);
                      setProjectStartDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerText,
                      projectStartDate.getFullYear() === year && styles.datePickerTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity 
              style={styles.datePickerDone}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    minHeight: 100,
    paddingTop: theme.spacing.md,
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
  pickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
    minWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.secondary,
  },
  modalItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
    minWidth: 0,
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 200,
    padding: theme.spacing.md,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  datePickerItem: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    marginVertical: 2,
  },
  datePickerItemSelected: {
    backgroundColor: theme.colors.secondary,
  },
  datePickerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
    minWidth: 0,
  },
  datePickerTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  datePickerDone: {
    backgroundColor: theme.colors.secondary,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
});