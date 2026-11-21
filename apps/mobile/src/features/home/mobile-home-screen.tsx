import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildCycleDay,
  getPhaseWindow,
  getCycleSummary,
  type CravingType,
  type IntensityLevel,
  type Mood,
  type SymptomType,
} from '@/core';
import {
  loadDailyCheckIn,
  saveDailyCheckIn,
  type DailyCheckInRecord,
} from '@/storage/mobile-database';
import { DailyLogsCard } from '@/features/logging/daily-logs-card';
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
  rose: '#D97B87',
};

type CheckInDraft = Omit<DailyCheckInRecord, 'cyclePhase' | 'date' | 'updatedAt' | 'userId'>;
type StorageState = 'error' | 'loading' | 'ready' | 'saving';

const energyOptions = [
  { label: 'Low', value: 2 },
  { label: 'Steady', value: 3 },
  { label: 'Good', value: 4 },
  { label: 'High', value: 5 },
] as const;

const moodOptions: { label: string; value: Mood }[] = [
  { label: 'Calm', value: 'calm' },
  { label: 'Happy', value: 'happy' },
  { label: 'Energized', value: 'energized' },
  { label: 'Sensitive', value: 'sensitive' },
  { label: 'Anxious', value: 'anxious' },
  { label: 'Low', value: 'low' },
];

const sleepOptions = [6, 7, 8, 9] as const;
const qualityOptions: { label: string; value: IntensityLevel }[] = [
  { label: 'Light', value: 2 },
  { label: 'Okay', value: 3 },
  { label: 'Good', value: 4 },
  { label: 'Restful', value: 5 },
];

const symptomOptions: { label: string; value: SymptomType }[] = [
  { label: 'Cramps', value: 'cramps' },
  { label: 'Bloating', value: 'bloating' },
  { label: 'Headache', value: 'headache' },
  { label: 'Fatigue', value: 'fatigue' },
  { label: 'Acne', value: 'acne' },
  { label: 'Mood shifts', value: 'mood_swings' },
];

const cravingOptions: { label: string; value: CravingType }[] = [
  { label: 'Sweet', value: 'sweet' },
  { label: 'Salty', value: 'salty' },
  { label: 'Carbs', value: 'carbs' },
  { label: 'Chocolate', value: 'chocolate' },
];

function createEmptyDraft(): CheckInDraft {
  return {
    cravings: [],
    energyLevel: 3,
    mood: 'calm',
    notes: '',
    sleepHours: 7,
    sleepQuality: 3,
    sorenessLevel: 2,
    stressLevel: 3,
    symptoms: [],
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatPhase(phase: string) {
  return `${phase.slice(0, 1).toUpperCase()}${phase.slice(1)}`;
}

function getCheckInMessage({
  hasSavedCheckIn,
  storageState,
}: {
  hasSavedCheckIn: boolean;
  storageState: StorageState;
}) {
  if (storageState === 'loading') return 'Loading your check-in from this device.';
  if (storageState === 'saving') return 'Saving privately on this device.';
  if (storageState === 'error') return 'Your check-in could not be saved locally. Try again.';
  if (hasSavedCheckIn) return 'Saved privately on this device.';

  return 'Nothing is shared. Save when this feels right.';
}

export function MobileHomeScreen() {
  const { profile } = useMobileProfile();
  const [checkIn, setCheckIn] = useState<CheckInDraft>(createEmptyDraft);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [hasSavedCheckIn, setHasSavedCheckIn] = useState(false);
  const [storageState, setStorageState] = useState<StorageState>('loading');
  const today = getLocalDateString();

  useEffect(() => {
    if (!profile) return;
    let isMounted = true;

    void loadDailyCheckIn({ date: today, userId: profile.userId })
      .then((savedCheckIn) => {
        if (!isMounted) return;

        if (savedCheckIn) {
          setCheckIn(toDraft(savedCheckIn));
          setHasSavedCheckIn(true);
        }
        setStorageState('ready');
      })
      .catch(() => {
        if (isMounted) setStorageState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [profile, today]);

  if (!profile) return null;

  const activeProfile = profile;

  const cycleSummary = getCycleSummary(
    buildCycleDay({
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
    }),
  );
  const phaseWindow = getPhaseWindow(cycleSummary.effectivePhase);
  const phaseDays = phaseWindow
    ? Array.from(
        { length: phaseWindow.endDay - phaseWindow.startDay + 1 },
        (_, index) => phaseWindow.startDay + index,
      )
    : [];

  async function handleSaveCheckIn() {
    if (storageState === 'saving') return;

    setStorageState('saving');

    try {
      await saveDailyCheckIn({
        ...checkIn,
        cravings: checkIn.cravings.length ? checkIn.cravings : ['none'],
        cyclePhase: cycleSummary.effectivePhase,
        date: today,
        userId: activeProfile.userId,
      });
      setHasSavedCheckIn(true);
      setStorageState('ready');
    } catch {
      setStorageState('error');
    }
  }

  function toggleCraving(craving: CravingType) {
    setCheckIn((currentCheckIn) => ({
      ...currentCheckIn,
      cravings: toggleValue(currentCheckIn.cravings.filter((value) => value !== 'none'), craving),
    }));
  }

  function toggleSymptom(symptom: SymptomType) {
    setCheckIn((currentCheckIn) => ({
      ...currentCheckIn,
      symptoms: toggleValue(currentCheckIn.symptoms, symptom),
    }));
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CYCLE COMPANION</Text>
              <Text style={styles.greeting}>{getGreeting()}, {profile.displayName}</Text>
            </View>
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          </View>

          <View style={styles.phaseCard}>
            <View style={styles.phaseCopy}>
              <Text style={styles.phaseLabel}>TODAY&apos;S CYCLE</Text>
              <Text style={styles.phaseTitle}>{formatPhase(cycleSummary.effectivePhase)}</Text>
              <Text style={styles.phaseDescription}>
                Day {cycleSummary.cycleDayNumber} of your cycle. {profile.irregularCycles ? 'Timing is a flexible estimate.' : 'This phase is an estimate, not a diagnosis.'}
              </Text>
            </View>
            <View style={styles.ring}>
              <View style={styles.ringInner}>
                <Text style={styles.ringDay}>DAY</Text>
                <Text style={styles.ringNumber}>{cycleSummary.cycleDayNumber}</Text>
                <Text style={styles.ringDetail}>of {profile.averageCycleLength}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineLabel}>{formatPhase(cycleSummary.effectivePhase).toUpperCase()} PHASE</Text>
              <Text style={styles.timelineMeta}>{profile.irregularCycles ? 'Likely' : 'Estimated'}</Text>
            </View>
            <View style={styles.timelineDots}>
              {phaseDays.map((day) => {
                const isCurrentDay = day === cycleSummary.cycleDayNumber;
                return (
                  <View key={day} style={styles.timelineDay}>
                    <View style={[styles.timelineDot, isCurrentDay && styles.timelineDotActive]} />
                    <Text style={[styles.timelineDayText, isCurrentDay && styles.timelineDayTextActive]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>How are you feeling?</Text>
              <Text style={styles.sectionDescription}>A short check-in for your own patterns.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: checkInOpen }}
              onPress={() => setCheckInOpen((isOpen) => !isOpen)}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Text style={styles.addButtonText}>{checkInOpen ? 'Close' : 'Check in'}</Text>
            </Pressable>
          </View>

          {checkInOpen ? (
            <View style={styles.checkInCard}>
              <FormGroup title="Energy right now">
                <View style={styles.optionRow}>
                  {energyOptions.map((option) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={option.label}
                      label={option.label}
                      onPress={() => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, energyLevel: option.value }))}
                      selected={checkIn.energyLevel === option.value}
                    />
                  ))}
                </View>
              </FormGroup>

              <FormGroup title="Mood">
                <View style={styles.optionWrap}>
                  {moodOptions.map((option) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={option.value}
                      label={option.label}
                      onPress={() => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, mood: option.value }))}
                      selected={checkIn.mood === option.value}
                    />
                  ))}
                </View>
              </FormGroup>

              <FormGroup title="Sleep last night">
                <View style={styles.optionRow}>
                  {sleepOptions.map((hours) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={hours}
                      label={`${hours}h`}
                      onPress={() => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, sleepHours: hours }))}
                      selected={checkIn.sleepHours === hours}
                    />
                  ))}
                </View>
                <View style={styles.optionRow}>
                  {qualityOptions.map((option) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={option.value}
                      label={option.label}
                      onPress={() => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, sleepQuality: option.value }))}
                      selected={checkIn.sleepQuality === option.value}
                    />
                  ))}
                </View>
              </FormGroup>

              <FormGroup title="Stress and soreness">
                <View style={styles.levelGrid}>
                  <LevelPicker
                    disabled={storageState === 'saving'}
                    label="Stress"
                    onChange={(value) => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, stressLevel: value }))}
                    value={checkIn.stressLevel}
                  />
                  <LevelPicker
                    disabled={storageState === 'saving'}
                    label="Soreness"
                    onChange={(value) => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, sorenessLevel: value }))}
                    value={checkIn.sorenessLevel}
                  />
                </View>
              </FormGroup>

              <FormGroup title="Symptoms">
                <View style={styles.optionWrap}>
                  {symptomOptions.map((option) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={option.value}
                      label={option.label}
                      onPress={() => toggleSymptom(option.value)}
                      selected={checkIn.symptoms.includes(option.value)}
                    />
                  ))}
                </View>
              </FormGroup>

              <FormGroup title="Cravings">
                <View style={styles.optionWrap}>
                  {cravingOptions.map((option) => (
                    <ChoiceChip
                      disabled={storageState === 'saving'}
                      key={option.value}
                      label={option.label}
                      onPress={() => toggleCraving(option.value)}
                      selected={checkIn.cravings.includes(option.value)}
                    />
                  ))}
                </View>
              </FormGroup>

              <FormGroup title="A note, if useful">
                <TextInput
                  accessibilityLabel="Check-in note"
                  editable={storageState !== 'saving'}
                  maxLength={280}
                  multiline
                  onChangeText={(notes) => setCheckIn((currentCheckIn) => ({ ...currentCheckIn, notes }))}
                  placeholder="Anything you want to remember?"
                  placeholderTextColor="#8C8C8C"
                  style={styles.notesInput}
                  textAlignVertical="top"
                  value={checkIn.notes}
                />
              </FormGroup>

              <Text accessibilityLiveRegion="polite" style={styles.checkInHint}>
                {getCheckInMessage({ hasSavedCheckIn, storageState })}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={storageState === 'saving'}
                onPress={() => void handleSaveCheckIn()}
                style={({ pressed }) => [
                  styles.saveButton,
                  storageState === 'saving' && styles.saveButtonDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.saveButtonText}>{storageState === 'saving' ? 'Saving...' : 'Save check-in'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.metricGrid}>
              <MetricCard detail={hasSavedCheckIn ? 'Saved today' : 'Starter view'} label="Energy" value={energyOptions.find((option) => option.value === checkIn.energyLevel)?.label ?? 'Steady'} />
              <MetricCard detail={hasSavedCheckIn ? 'Last night' : 'Starter view'} label="Sleep" value={`${checkIn.sleepHours ?? 7}h`} />
              <MetricCard detail="Today" label="Readiness" value="76%" />
            </View>
          )}

          <DailyLogsCard
            cyclePhase={cycleSummary.effectivePhase}
            date={today}
            userId={activeProfile.userId}
          />

          <View style={styles.focusCard}>
            <View style={styles.focusAccent} />
            <View style={styles.focusContent}>
              <Text style={styles.focusEyebrow}>TODAY&apos;S FOCUS</Text>
              <Text style={styles.focusTitle}>Support steady energy</Text>
              <Text style={styles.focusText}>
                Your starter pattern suggests a balanced meal, water, and movement that matches your energy.
              </Text>
              <Text style={styles.focusAction}>Plan a gentle strength session</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightEyebrow}>PATTERN TO NOTICE</Text>
            <Text style={styles.insightTitle}>Energy has been steadier after fuller nights of sleep.</Text>
            <Text style={styles.insightText}>Based on your starter history. This is a pattern cue, not health advice.</Text>
          </View>

          <Text style={styles.privacyNote}>Your logs stay on this device as the mobile app is built out.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ChoiceChip({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceChip, selected && styles.choiceChipSelected, pressed && styles.pressed]}>
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function FormGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LevelPicker({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: IntensityLevel) => void;
  value: IntensityLevel | null;
}) {
  return (
    <View style={styles.levelPicker}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View style={styles.levelDots}>
        {([1, 2, 3, 4, 5] as IntensityLevel[]).map((level) => (
          <Pressable
            accessibilityLabel={`${label} ${level} of 5`}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: value === level }}
            disabled={disabled}
            key={level}
            onPress={() => onChange(level)}
            style={({ pressed }) => [
              styles.levelDot,
              value !== null && level <= value && styles.levelDotActive,
              pressed && styles.pressed,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function toDraft(savedCheckIn: DailyCheckInRecord): CheckInDraft {
  const { cyclePhase: _cyclePhase, date: _date, updatedAt: _updatedAt, userId: _userId, ...draft } = savedCheckIn;

  return {
    ...draft,
    cravings: draft.cravings.filter((craving) => craving !== 'none'),
  };
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 118, gap: 28 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  eyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 6 },
  privateBadge: { backgroundColor: colors.sageSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  privateBadgeText: { color: '#497353', fontSize: 12, fontWeight: '700' },
  phaseCard: { backgroundColor: colors.lavenderSoft, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 192, overflow: 'hidden', padding: 24 },
  phaseCopy: { flex: 1, paddingRight: 12 },
  phaseLabel: { color: '#6A5E87', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  phaseTitle: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 8 },
  phaseDescription: { color: colors.secondaryText, fontSize: 13, lineHeight: 19, marginTop: 8 },
  ring: { alignItems: 'center', backgroundColor: colors.lavender, borderColor: '#AB9BCF', borderRadius: 70, borderWidth: 8, height: 124, justifyContent: 'center', width: 124 },
  ringInner: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 54, height: 100, justifyContent: 'center', width: 100 },
  ringDay: { color: colors.secondaryText, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  ringNumber: { color: colors.text, fontSize: 30, fontWeight: '700', lineHeight: 35 },
  ringDetail: { color: colors.secondaryText, fontSize: 11 },
  timeline: { gap: 14 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineLabel: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.9 },
  timelineMeta: { color: colors.secondaryText, fontSize: 12 },
  timelineDots: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineDay: { alignItems: 'center', gap: 7 },
  timelineDot: { backgroundColor: '#E4DCF5', borderRadius: 6, height: 8, width: 8 },
  timelineDotActive: { backgroundColor: '#7E6AAB', borderRadius: 8, height: 16, marginTop: -4, width: 16 },
  timelineDayText: { color: colors.secondaryText, fontSize: 10 },
  timelineDayTextActive: { color: colors.text, fontWeight: '700' },
  sectionHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '700' },
  sectionDescription: { color: colors.secondaryText, fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 250 },
  addButton: { backgroundColor: colors.text, borderRadius: 18, minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  metricGrid: { flexDirection: 'row', gap: 10 },
  metricCard: { backgroundColor: colors.cream, borderRadius: 18, flex: 1, minHeight: 124, padding: 15 },
  metricLabel: { color: colors.secondaryText, fontSize: 12 },
  metricValue: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 12 },
  metricDetail: { color: colors.secondaryText, fontSize: 11, marginTop: 4 },
  checkInCard: { backgroundColor: colors.cream, borderRadius: 20, gap: 22, padding: 20 },
  formGroup: { gap: 10 },
  formTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { alignItems: 'center', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 13 },
  choiceChipSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  choiceChipText: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  choiceChipTextSelected: { color: '#FFFFFF' },
  levelGrid: { flexDirection: 'row', gap: 12 },
  levelPicker: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, flex: 1, gap: 10, padding: 12 },
  levelLabel: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  levelDots: { flexDirection: 'row', justifyContent: 'space-between' },
  levelDot: { backgroundColor: colors.stone, borderRadius: 7, height: 12, width: 12 },
  levelDotActive: { backgroundColor: colors.sage },
  notesInput: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 14, lineHeight: 20, minHeight: 92, padding: 12 },
  checkInHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: -6 },
  saveButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 18, justifyContent: 'center', minHeight: 52 },
  saveButtonDisabled: { backgroundColor: '#6D6D6D' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  focusCard: { backgroundColor: colors.sageSoft, borderRadius: 20, flexDirection: 'row', overflow: 'hidden' },
  focusAccent: { backgroundColor: colors.sage, width: 6 },
  focusContent: { gap: 7, padding: 20, paddingLeft: 18, flex: 1 },
  focusEyebrow: { color: '#497353', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  focusTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  focusText: { color: '#556357', fontSize: 13, lineHeight: 19 },
  focusAction: { color: '#497353', fontSize: 13, fontWeight: '700', marginTop: 4 },
  insightCard: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 20, borderWidth: 1, gap: 8, padding: 20 },
  insightEyebrow: { color: colors.rose, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  insightTitle: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  insightText: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
  privacyNote: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
