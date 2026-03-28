import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Save, Calendar, ChevronDown, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { CLIENTS } from '@/types/project';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { allProjects, updateProject } = useProjects();
  
  const project = allProjects.find(p => p.id === id);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState('Bottomline');
  const [totalRevenue, setTotalRevenue] = useState('');
  const [projectStartDate, setProjectStartDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setAddress(project.address || '');
      setClient(project.client);
      setTotalRevenue(project.totalRevenue.toString());
      setProjectStartDate(project.projectStartDate);
      setNotes(project.notes || '');
    }
  }, [project]);

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    const revenue = parseFloat(totalRevenue);
    if (isNaN(revenue) || revenue < 0) {
      Alert.alert('Error', 'Please enter a valid total revenue amount');
      return;
    }

    setIsLoading(true);
    
    try {
      updateProject(project.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        client,
        totalRevenue: revenue,
        projectStartDate,
        notes: notes.trim() || undefined,
      });
      
      Alert.alert('Success', 'Project updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setProjectStartDate(selectedDate);
    }
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Edit Project',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerButton, styles.saveButton]}
              disabled={isLoading}
            >
              <Save size={20} color={theme.colors.primary} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
              placeholder="Enter project address"
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
            <Text style={styles.label}>Total Revenue *</Text>
            <TextInput
              style={styles.input}
              value={totalRevenue}
              onChangeText={setTotalRevenue}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Start Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={styles.dateButtonText}>
                {formatDate(projectStartDate)}
              </Text>
            </TouchableOpacity>
          </View>



          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.bottomSaveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Save size={20} color="white" />
            <Text style={styles.bottomSaveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleDatePickerCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleDatePickerCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleDatePickerDone}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={projectStartDate}
                  mode="date"
                  display="compact"
                  onChange={onDateChange}
                  minimumDate={new Date(2020, 0, 1)}
                  maximumDate={new Date(2050, 11, 31)}
                  style={styles.datePicker}
                  textColor={theme.colors.text}
                  themeVariant="light"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={projectStartDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2050, 11, 31)}
        />
      )}
      
      {/* Client Picker Modal */}
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
    </>
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
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  saveButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  form: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
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
    height: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
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
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  dateButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  bottomSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  bottomSaveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg,
    minHeight: 280,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  modalCancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  modalDoneText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: '600' as const,
  },
  datePickerContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  datePicker: {
    backgroundColor: theme.colors.surface,
    height: 180,
    width: '100%',
  },
});