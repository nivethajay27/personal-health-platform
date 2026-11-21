import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildCycleDay, getCycleSummary, type CyclePhase } from '@/core';
import { useMobileProfile } from '@/features/profile/mobile-profile-context';
import { getLocalDateString } from '@/utils/date';

const colors = {
  background: '#FCFBF8',
  cream: '#FAF8F4',
  stone: '#E8E4DE',
  text: '#2D2D2D',
  secondaryText: '#727272',
  sage: '#7FAF8A',
  sageSoft: '#E5F1E6',
  lavender: '#C6B8E8',
  lavenderSoft: '#F0ECFA',
};

const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function MobileCycleScreen() {
  const { profile, saveProfile } = useMobileProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [cycleLength, setCycleLength] = useState(profile ? String(profile.averageCycleLength) : '28');
  const [periodLength, setPeriodLength] = useState(profile ? String(profile.averagePeriodLength) : '5');
  const [irregularCycles, setIrregularCycles] = useState(profile?.irregularCycles ?? false);
  const [phaseOverride, setPhaseOverride] = useState<CyclePhase | null>(profile?.manualPhaseOverride ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return null;

  const activeProfile = profile;

  const today = getLocalDateString();
  const cycleDay = buildCycleDay({
    cycle: {
      averageCycleLength: activeProfile.averageCycleLength,
      averagePeriodLength: activeProfile.averagePeriodLength,
      createdAt: activeProfile.updatedAt,
      id: `cycle-${activeProfile.userId}`,
      startDate: activeProfile.periodStartDate,
      updatedAt: activeProfile.updatedAt,
      userId: activeProfile.userId,
    },
    phaseOverride: activeProfile.manualPhaseOverride ?? undefined,
    targetDate: today,
  });
  const cycleSummary = getCycleSummary(cycleDay);

  async function saveChanges(
    nextStartDate = activeProfile.periodStartDate,
    nextPhaseOverride = phaseOverride,
  ) {
    const nextCycleLength = Number(cycleLength);
    const nextPeriodLength = Number(periodLength);

    if (!Number.isInteger(nextCycleLength) || nextCycleLength < 15 || nextCycleLength > 60) {
      setError('Cycle length should be a whole number from 15 to 60 days.');
      return;
    }
    if (!Number.isInteger(nextPeriodLength) || nextPeriodLength < 1 || nextPeriodLength > 14) {
      setError('Period length should be a whole number from 1 to 14 days.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await saveProfile({
        averageCycleLength: nextCycleLength,
        averagePeriodLength: nextPeriodLength,
        displayName: activeProfile.displayName,
        irregularCycles,
        manualPhaseOverride: nextPhaseOverride,
        periodStartDate: nextStartDate,
        userId: activeProfile.userId,
      });
      setIsEditing(false);
    } catch {
      setError('Your cycle settings could not be saved locally. Try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function logPeriodStart() {
    setPhaseOverride(null);
    await saveChanges(today, null);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR CYCLE</Text>
              <Text style={styles.title}>A flexible estimate.</Text>
            </View>
            <View style={styles.estimateBadge}>
              <Text style={styles.estimateBadgeText}>{profile.irregularCycles ? 'Likely' : 'Estimated'}</Text>
            </View>
          </View>
          <Text style={styles.description}>
            You can update this whenever your body tells a different story.
          </Text>

          <View style={styles.phaseCard}>
            <View style={styles.phaseCopy}>
              <Text style={styles.phaseEyebrow}>CURRENT PHASE</Text>
              <Text style={styles.phaseTitle}>{formatPhase(cycleSummary.effectivePhase)}</Text>
              <Text style={styles.phaseText}>Day {cycleSummary.cycleDayNumber} of an estimated {profile.averageCycleLength}-day cycle.</Text>
            </View>
            <View style={[styles.dayCircle, { borderColor: phaseColor(cycleSummary.effectivePhase) }]}>
              <Text style={styles.dayLabel}>DAY</Text>
              <Text style={styles.dayNumber}>{cycleSummary.cycleDayNumber}</Text>
            </View>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.sectionEyebrow}>CYCLE TIMELINE</Text>
            <View style={styles.dayGrid}>
              {Array.from({ length: profile.averageCycleLength }, (_, index) => {
                const day = index + 1;
                const phase = phaseForDay(day, profile.averageCycleLength);
                const isCurrent = day === cycleSummary.cycleDayNumber;
                return (
                  <View key={day} style={styles.dayCell}>
                    <View style={[styles.dayDot, { backgroundColor: phaseColor(phase) }, isCurrent && styles.dayDotCurrent]} />
                    <Text style={[styles.dayText, isCurrent && styles.dayTextCurrent]}>{day}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.timelineHint}>Colors show estimated phases. A manual override takes priority when you save it below.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void logPeriodStart()}
            style={({ pressed }) => [styles.periodButton, isSaving && styles.buttonDisabled, pressed && styles.pressed]}>
            <Text style={styles.periodButtonText}>Log period start today</Text>
          </Pressable>

          <View style={styles.controlsCard}>
            <View style={styles.controlsHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>YOUR CONTROLS</Text>
                <Text style={styles.sectionTitle}>Make the estimate yours</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setIsEditing((value) => !value)}>
                <Text style={styles.editText}>{isEditing ? 'Close' : 'Edit'}</Text>
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.numberRow}>
                  <Field label="Cycle length">
                    <TextInput keyboardType="number-pad" maxLength={2} onChangeText={setCycleLength} style={styles.input} value={cycleLength} />
                  </Field>
                  <Field label="Period length">
                    <TextInput keyboardType="number-pad" maxLength={2} onChangeText={setPeriodLength} style={styles.input} value={periodLength} />
                  </Field>
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchCopy}>
                    <Text style={styles.fieldLabel}>Cycles vary month to month</Text>
                    <Text style={styles.fieldHint}>Use gentler, range-based guidance.</Text>
                  </View>
                  <Switch onValueChange={setIrregularCycles} thumbColor="#FFFFFF" trackColor={{ false: colors.stone, true: colors.sage }} value={irregularCycles} />
                </View>

                <View style={styles.overrideGroup}>
                  <Text style={styles.fieldLabel}>Manual phase override</Text>
                  <View style={styles.overrideOptions}>
                    {phases.map((phase) => {
                      const selected = phaseOverride === phase;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          key={phase}
                          onPress={() => setPhaseOverride(selected ? null : phase)}
                          style={({ pressed }) => [styles.overrideChip, selected && styles.overrideChipSelected, pressed && styles.pressed]}>
                          <Text style={[styles.overrideChipText, selected && styles.overrideChipTextSelected]}>{formatPhase(phase)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.fieldHint}>Use this when the estimated phase does not feel right. You can remove it at any time.</Text>
                </View>

                {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={() => void saveChanges()}
                  style={({ pressed }) => [styles.saveButton, isSaving && styles.buttonDisabled, pressed && styles.pressed]}>
                  <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save cycle settings'}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.controlsText}>Last period start: {profile.periodStartDate}. Cycle and period lengths are stored only on this device.</Text>
            )}
          </View>

          <Text style={styles.disclaimer}>Cycle estimates are for personal pattern awareness, not diagnosis, treatment, or fertility prediction.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function phaseForDay(day: number, cycleLength: number): CyclePhase {
  const normalizedDay = ((day - 1) % cycleLength) + 1;
  if (normalizedDay <= 5) return 'menstrual';
  if (normalizedDay <= 13) return 'follicular';
  if (normalizedDay <= 16) return 'ovulatory';
  return 'luteal';
}

function phaseColor(phase: CyclePhase) {
  const phaseColors: Record<CyclePhase, string> = {
    follicular: '#A6D7A7',
    luteal: '#C6B8E8',
    menstrual: '#D97B87',
    ovulatory: '#F4D77A',
  };

  return phaseColors[phase];
}

function formatPhase(phase: CyclePhase) {
  return `${phase.slice(0, 1).toUpperCase()}${phase.slice(1)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { gap: 20, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 118 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  eyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 29, fontWeight: '700', marginTop: 6 },
  description: { color: colors.secondaryText, fontSize: 14, lineHeight: 21, marginTop: -7 },
  estimateBadge: { backgroundColor: colors.sageSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  estimateBadgeText: { color: '#497353', fontSize: 12, fontWeight: '700' },
  phaseCard: { alignItems: 'center', backgroundColor: colors.lavenderSoft, borderRadius: 22, flexDirection: 'row', gap: 16, justifyContent: 'space-between', padding: 22 },
  phaseCopy: { flex: 1, gap: 7 },
  phaseEyebrow: { color: '#6A5E87', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  phaseTitle: { color: colors.text, fontSize: 27, fontWeight: '700' },
  phaseText: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  dayCircle: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 44, borderWidth: 7, height: 88, justifyContent: 'center', width: 88 },
  dayLabel: { color: colors.secondaryText, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dayNumber: { color: colors.text, fontSize: 27, fontWeight: '700' },
  timelineCard: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 20, borderWidth: 1, gap: 14, padding: 20 },
  sectionEyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4, width: '10%' },
  dayDot: { borderRadius: 7, height: 12, width: 12 },
  dayDotCurrent: { borderColor: colors.text, borderWidth: 2, height: 16, width: 16 },
  dayText: { color: colors.secondaryText, fontSize: 10 },
  dayTextCurrent: { color: colors.text, fontWeight: '700' },
  timelineHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
  periodButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 18, justifyContent: 'center', minHeight: 52 },
  periodButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  controlsCard: { backgroundColor: colors.cream, borderRadius: 20, gap: 15, padding: 20 },
  controlsHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 5 },
  editText: { color: '#497353', fontSize: 13, fontWeight: '700' },
  controlsText: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  editForm: { gap: 16 },
  numberRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 8 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  fieldHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 17 },
  input: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  switchRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', gap: 14, justifyContent: 'space-between', padding: 13 },
  switchCopy: { flex: 1, gap: 4 },
  overrideGroup: { gap: 10 },
  overrideOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overrideChip: { borderColor: colors.stone, borderRadius: 14, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  overrideChipSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  overrideChipText: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  overrideChipTextSelected: { color: '#FFFFFF' },
  error: { color: '#A64D59', fontSize: 12, lineHeight: 18 },
  saveButton: { alignItems: 'center', backgroundColor: colors.sage, borderRadius: 18, justifyContent: 'center', minHeight: 50 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { backgroundColor: '#6D6D6D' },
  disclaimer: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
