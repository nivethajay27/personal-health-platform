import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMobileProfile } from '@/features/profile/mobile-profile-context';
import { getLocalDateString, isIsoDate } from '@/utils/date';

const colors = {
  background: '#FCFBF8',
  cream: '#FAF8F4',
  stone: '#E8E4DE',
  text: '#2D2D2D',
  secondaryText: '#727272',
  sage: '#7FAF8A',
  sageSoft: '#E5F1E6',
  lavenderSoft: '#F0ECFA',
};

const LOCAL_USER_ID = 'local_user';

export function ProfileSetupScreen() {
  const { saveProfile, state } = useMobileProfile();
  const [displayName, setDisplayName] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState(getLocalDateString);
  const [averageCycleLength, setAverageCycleLength] = useState('28');
  const [averagePeriodLength, setAveragePeriodLength] = useState('5');
  const [irregularCycles, setIrregularCycles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleContinue() {
    const cycleLength = Number(averageCycleLength);
    const periodLength = Number(averagePeriodLength);

    if (!displayName.trim()) {
      setError('Add a name or greeting to continue.');
      return;
    }
    if (!isIsoDate(periodStartDate) || periodStartDate > getLocalDateString()) {
      setError('Use a past or current date in YYYY-MM-DD format.');
      return;
    }
    if (!Number.isInteger(cycleLength) || cycleLength < 15 || cycleLength > 60) {
      setError('Cycle length should be a whole number from 15 to 60 days.');
      return;
    }
    if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 14) {
      setError('Period length should be a whole number from 1 to 14 days.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await saveProfile({
        averageCycleLength: cycleLength,
        averagePeriodLength: periodLength,
        displayName: displayName.trim(),
        irregularCycles,
        manualPhaseOverride: null,
        periodStartDate,
        userId: LOCAL_USER_ID,
      });
    } catch {
      setError('Your setup could not be saved on this device. Try again.');
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>CYCLE COMPANION</Text>
            <Text style={styles.title}>Set up your private cycle space.</Text>
            <Text style={styles.description}>
              A few details help the app estimate your cycle context. They stay on this device.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Field label="What should we call you?">
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#8C8C8C"
                style={styles.input}
                value={displayName}
              />
            </Field>

            <Field hint="YYYY-MM-DD" label="First day of your latest period">
              <TextInput
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={setPeriodStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8C8C8C"
                style={styles.input}
                value={periodStartDate}
              />
            </Field>

            <View style={styles.numberRow}>
              <View style={styles.numberField}>
                <Field label="Cycle length">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={setAverageCycleLength}
                    style={styles.input}
                    value={averageCycleLength}
                  />
                </Field>
              </View>
              <View style={styles.numberField}>
                <Field label="Period length">
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={setAveragePeriodLength}
                    style={styles.input}
                    value={averagePeriodLength}
                  />
                </Field>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.fieldLabel}>My cycles are irregular</Text>
                <Text style={styles.fieldHint}>We will show estimates as flexible guidance.</Text>
              </View>
              <Switch
                accessibilityLabel="My cycles are irregular"
                onValueChange={setIrregularCycles}
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.stone, true: colors.sage }}
                value={irregularCycles}
              />
            </View>

            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            {state === 'error' ? <Text style={styles.error}>Local storage is unavailable right now.</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void handleContinue()}
              style={({ pressed }) => [styles.continueButton, isSaving && styles.buttonDisabled, pressed && styles.pressed]}>
              <Text style={styles.continueButtonText}>{isSaving ? 'Saving...' : 'Continue privately'}</Text>
            </Pressable>
          </View>

          <View style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>No account needed</Text>
            <Text style={styles.privacyText}>Your profile and logs are stored locally. This app does not provide medical advice or fertility prediction.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Field({ children, hint, label }: { children: ReactNode; hint?: string; label: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { gap: 24, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 44 },
  hero: { gap: 9 },
  eyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', lineHeight: 37 },
  description: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  formCard: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 22, borderWidth: 1, gap: 19, padding: 20 },
  field: { gap: 8 },
  fieldHeader: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  fieldHint: { color: colors.secondaryText, fontSize: 12 },
  input: { backgroundColor: colors.cream, borderColor: colors.stone, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 48, paddingHorizontal: 13 },
  numberRow: { flexDirection: 'row', gap: 12 },
  numberField: { flex: 1 },
  switchRow: { alignItems: 'center', backgroundColor: colors.lavenderSoft, borderRadius: 16, flexDirection: 'row', gap: 16, justifyContent: 'space-between', padding: 14 },
  switchCopy: { flex: 1, gap: 4 },
  error: { color: '#A64D59', fontSize: 12, lineHeight: 18 },
  continueButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 18, justifyContent: 'center', minHeight: 52 },
  buttonDisabled: { backgroundColor: '#6D6D6D' },
  continueButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  privacyCard: { backgroundColor: colors.sageSoft, borderRadius: 18, gap: 6, padding: 18 },
  privacyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  privacyText: { color: '#556357', fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
