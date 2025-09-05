import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { theme } from '@/constants/theme';

export default function BackendTestScreen() {
  const [name, setName] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const hiMutation = trpc.example.hi.useMutation({
    onSuccess: (data) => {
      setResult(`Hello ${data.hello}! Server time: ${data.date}`);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
      console.error('tRPC Error:', error);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    hiMutation.mutate({ name: name.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Backend Test</Text>
        <Text style={styles.subtitle}>Test tRPC connection</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter your name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, hiMutation.isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={hiMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {hiMutation.isPending ? 'Sending...' : 'Say Hi to Backend'}
          </Text>
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Response:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        {hiMutation.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error: {hiMutation.error.message}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultContainer: {
    backgroundColor: theme.colors.success + '20',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.success,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
});