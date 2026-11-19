import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CyclePhase, IntensityLevel, MealType, NutrientFocus, WorkoutType } from '@/core';
import {
  loadMealLog,
  loadRecoveryLog,
  loadWorkoutLog,
  saveMealLog,
  saveRecoveryLog,
  saveWorkoutLog,
  type MealLogRecord,
  type RecoveryLogRecord,
  type WorkoutLogRecord,
} from '@/storage/mobile-database';

const colors = {
  cream: '#FAF8F4',
  stone: '#E8E4DE',
  text: '#2D2D2D',
  secondaryText: '#727272',
  sage: '#7FAF8A',
  sageSoft: '#E5F1E6',
};

type LogTab = 'food' | 'recovery' | 'workout';
type StorageState = 'error' | 'loading' | 'ready' | 'saving';

const tabs: { label: string; value: LogTab }[] = [
  { label: 'Food', value: 'food' },
  { label: 'Workout', value: 'workout' },
  { label: 'Recovery', value: 'recovery' },
];

const mealOptions: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

const nutrientOptions: { label: string; value: NutrientFocus }[] = [
  { label: 'Protein', value: 'protein_focused' },
  { label: 'Fiber', value: 'fiber' },
  { label: 'Hydration', value: 'hydration' },
  { label: 'Iron', value: 'iron_rich' },
  { label: 'Magnesium', value: 'magnesium_rich' },
  { label: 'Complex carbs', value: 'complex_carbs' },
];

const workoutOptions: { label: string; value: WorkoutType }[] = [
  { label: 'Walk', value: 'walking' },
  { label: 'Yoga', value: 'yoga' },
  { label: 'Pilates', value: 'pilates' },
  { label: 'Strength', value: 'strength_training' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Stretch', value: 'stretching' },
  { label: 'Rest day', value: 'rest_day' },
];

const durationOptions = [20, 30, 45, 60] as const;
const sleepOptions = [6, 7, 8, 9] as const;

export function DailyLogsCard({
  cyclePhase,
  date,
  userId,
}: {
  cyclePhase: CyclePhase;
  date: string;
  userId: string;
}) {
  const [activeTab, setActiveTab] = useState<LogTab>('food');
  const [foodLog, setFoodLog] = useState(createFoodLog);
  const [recoveryLog, setRecoveryLog] = useState(createRecoveryLog);
  const [storageState, setStorageState] = useState<StorageState>('loading');
  const [workoutLog, setWorkoutLog] = useState(createWorkoutLog);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadMealLog({ date, userId }),
      loadWorkoutLog({ date, userId }),
      loadRecoveryLog({ date, userId }),
    ])
      .then(([savedFood, savedWorkout, savedRecovery]) => {
        if (!isMounted) return;

        if (savedFood) setFoodLog(toFoodDraft(savedFood));
        if (savedWorkout) setWorkoutLog(toWorkoutDraft(savedWorkout));
        if (savedRecovery) setRecoveryLog(toRecoveryDraft(savedRecovery));
        setStorageState('ready');
      })
      .catch(() => {
        if (isMounted) setStorageState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [date, userId]);

  async function handleSave() {
    if (storageState === 'saving') return;

    setStorageState('saving');

    try {
      if (activeTab === 'food') {
        await saveMealLog({ ...foodLog, cyclePhase, date, userId });
      } else if (activeTab === 'workout') {
        await saveWorkoutLog({ ...workoutLog, cyclePhase, date, userId });
      } else {
        await saveRecoveryLog({
          ...recoveryLog,
          date,
          readinessScore: getReadinessScore(recoveryLog),
          userId,
        });
      }
      setStorageState('ready');
    } catch {
      setStorageState('error');
    }
  }

  const isSaving = storageState === 'saving';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>DAILY LOGS</Text>
          <Text style={styles.title}>Notice what supports you.</Text>
        </View>
        <Text style={styles.phase}>{formatPhase(cyclePhase)}</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}>
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'food' ? (
        <FoodForm disabled={isSaving} log={foodLog} onChange={setFoodLog} />
      ) : activeTab === 'workout' ? (
        <WorkoutForm disabled={isSaving} log={workoutLog} onChange={setWorkoutLog} />
      ) : (
        <RecoveryForm disabled={isSaving} log={recoveryLog} onChange={setRecoveryLog} />
      )}

      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {getStatusMessage(activeTab, storageState)}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void handleSave()}
        style={({ pressed }) => [
          styles.saveButton,
          isSaving && styles.saveButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : getSaveLabel(activeTab)}</Text>
      </Pressable>
    </View>
  );
}

function FoodForm({
  disabled,
  log,
  onChange,
}: {
  disabled: boolean;
  log: FoodDraft;
  onChange: (log: FoodDraft | ((currentLog: FoodDraft) => FoodDraft)) => void;
}) {
  return (
    <View style={styles.form}>
      <FormGroup title="Meal">
        <View style={styles.optionWrap}>
          {mealOptions.map((option) => (
            <ChoiceChip
              disabled={disabled}
              key={option.value}
              label={option.label}
              onPress={() => onChange((currentLog) => ({ ...currentLog, mealType: option.value }))}
              selected={log.mealType === option.value}
            />
          ))}
        </View>
        <TextInput
          accessibilityLabel="Meal description"
          editable={!disabled}
          maxLength={80}
          onChangeText={(name) => onChange((currentLog) => ({ ...currentLog, name }))}
          placeholder="What did you have?"
          placeholderTextColor="#8C8C8C"
          style={styles.textInput}
          value={log.name}
        />
      </FormGroup>

      <FormGroup title="Nutrient focus">
        <View style={styles.optionWrap}>
          {nutrientOptions.map((option) => (
            <ChoiceChip
              disabled={disabled}
              key={option.value}
              label={option.label}
              onPress={() => onChange((currentLog) => ({
                ...currentLog,
                nutrientFocus: toggleValue(currentLog.nutrientFocus, option.value),
              }))}
              selected={log.nutrientFocus.includes(option.value)}
            />
          ))}
        </View>
      </FormGroup>

      <View style={styles.scaleGrid}>
        <ScalePicker disabled={disabled} label="Protein" onChange={(value) => onChange((currentLog) => ({ ...currentLog, proteinEstimate: value }))} value={log.proteinEstimate} />
        <ScalePicker disabled={disabled} label="Fiber" onChange={(value) => onChange((currentLog) => ({ ...currentLog, fiberEstimate: value }))} value={log.fiberEstimate} />
        <ScalePicker disabled={disabled} label="Hydration" onChange={(value) => onChange((currentLog) => ({ ...currentLog, hydrationEstimate: value }))} value={log.hydrationEstimate} />
      </View>

      <FormGroup title="Cravings">
        <View style={styles.optionRow}>
          <ChoiceChip disabled={disabled} label="Not today" onPress={() => onChange((currentLog) => ({ ...currentLog, cravingsPresent: false }))} selected={!log.cravingsPresent} />
          <ChoiceChip disabled={disabled} label="Present" onPress={() => onChange((currentLog) => ({ ...currentLog, cravingsPresent: true }))} selected={log.cravingsPresent} />
        </View>
      </FormGroup>
      <NotesInput disabled={disabled} onChange={(notes) => onChange((currentLog) => ({ ...currentLog, notes }))} value={log.notes} />
    </View>
  );
}

function WorkoutForm({
  disabled,
  log,
  onChange,
}: {
  disabled: boolean;
  log: WorkoutDraft;
  onChange: (log: WorkoutDraft | ((currentLog: WorkoutDraft) => WorkoutDraft)) => void;
}) {
  return (
    <View style={styles.form}>
      <FormGroup title="Movement">
        <View style={styles.optionWrap}>
          {workoutOptions.map((option) => (
            <ChoiceChip
              disabled={disabled}
              key={option.value}
              label={option.label}
              onPress={() => onChange((currentLog) => ({ ...currentLog, type: option.value }))}
              selected={log.type === option.value}
            />
          ))}
        </View>
      </FormGroup>

      <FormGroup title="Duration">
        <View style={styles.optionRow}>
          {durationOptions.map((duration) => (
            <ChoiceChip
              disabled={disabled}
              key={duration}
              label={`${duration} min`}
              onPress={() => onChange((currentLog) => ({ ...currentLog, durationMinutes: duration }))}
              selected={log.durationMinutes === duration}
            />
          ))}
        </View>
      </FormGroup>

      <View style={styles.scaleGrid}>
        <ScalePicker disabled={disabled} label="Intensity" onChange={(value) => onChange((currentLog) => ({ ...currentLog, intensity: value }))} value={log.intensity} />
        <ScalePicker disabled={disabled} label="Effort" onChange={(value) => onChange((currentLog) => ({ ...currentLog, perceivedEffort: value }))} value={log.perceivedEffort} />
        <ScalePicker disabled={disabled} label="Afterward" onChange={(value) => onChange((currentLog) => ({ ...currentLog, recoveryAfterward: value }))} value={log.recoveryAfterward} />
      </View>
      <NotesInput disabled={disabled} onChange={(notes) => onChange((currentLog) => ({ ...currentLog, notes }))} value={log.notes} />
    </View>
  );
}

function RecoveryForm({
  disabled,
  log,
  onChange,
}: {
  disabled: boolean;
  log: RecoveryDraft;
  onChange: (log: RecoveryDraft | ((currentLog: RecoveryDraft) => RecoveryDraft)) => void;
}) {
  return (
    <View style={styles.form}>
      <FormGroup title="Sleep">
        <View style={styles.optionRow}>
          {sleepOptions.map((hours) => (
            <ChoiceChip
              disabled={disabled}
              key={hours}
              label={`${hours}h`}
              onPress={() => onChange((currentLog) => ({ ...currentLog, sleepHours: hours }))}
              selected={log.sleepHours === hours}
            />
          ))}
        </View>
      </FormGroup>

      <View style={styles.scaleGrid}>
        <ScalePicker disabled={disabled} label="Sleep quality" onChange={(value) => onChange((currentLog) => ({ ...currentLog, sleepQuality: value }))} value={log.sleepQuality} />
        <ScalePicker disabled={disabled} label="Hydration" onChange={(value) => onChange((currentLog) => ({ ...currentLog, hydrationLevel: value }))} value={log.hydrationLevel} />
        <ScalePicker disabled={disabled} label="Fatigue" onChange={(value) => onChange((currentLog) => ({ ...currentLog, fatigueLevel: value }))} value={log.fatigueLevel} />
        <ScalePicker disabled={disabled} label="Stress" onChange={(value) => onChange((currentLog) => ({ ...currentLog, stressLevel: value }))} value={log.stressLevel} />
        <ScalePicker disabled={disabled} label="Soreness" onChange={(value) => onChange((currentLog) => ({ ...currentLog, sorenessLevel: value }))} value={log.sorenessLevel} />
      </View>
      <NotesInput disabled={disabled} onChange={(notes) => onChange((currentLog) => ({ ...currentLog, notes }))} value={log.notes} />
    </View>
  );
}

function ChoiceChip({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
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

function ScalePicker({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: IntensityLevel) => void;
  value: IntensityLevel;
}) {
  return (
    <View style={styles.scalePicker}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleDots}>
        {([1, 2, 3, 4, 5] as IntensityLevel[]).map((level) => (
          <Pressable
            accessibilityLabel={`${label} ${level} of 5`}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: value === level }}
            disabled={disabled}
            key={level}
            onPress={() => onChange(level)}
            style={({ pressed }) => [
              styles.scaleDot,
              level <= value && styles.scaleDotActive,
              pressed && styles.pressed,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function FormGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formTitle}>{title}</Text>
      {children}
    </View>
  );
}

function NotesInput({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FormGroup title="A note, if useful">
      <TextInput
        accessibilityLabel="Log note"
        editable={!disabled}
        maxLength={280}
        multiline
        onChangeText={onChange}
        placeholder="Anything you want to remember?"
        placeholderTextColor="#8C8C8C"
        style={styles.notesInput}
        textAlignVertical="top"
        value={value}
      />
    </FormGroup>
  );
}

function createFoodLog(): FoodDraft {
  return {
    cravingsPresent: false,
    fiberEstimate: 3,
    hydrationEstimate: 3,
    mealType: 'breakfast',
    name: '',
    notes: '',
    nutrientFocus: [],
    proteinEstimate: 3,
  };
}

function createWorkoutLog(): WorkoutDraft {
  return {
    durationMinutes: 30,
    intensity: 3,
    notes: '',
    perceivedEffort: 3,
    recoveryAfterward: 3,
    type: 'walking',
  };
}

function createRecoveryLog(): RecoveryDraft {
  return {
    fatigueLevel: 2,
    hydrationLevel: 3,
    notes: '',
    sleepHours: 7,
    sleepQuality: 3,
    sorenessLevel: 2,
    stressLevel: 3,
  };
}

function toFoodDraft(log: MealLogRecord): FoodDraft {
  const { cyclePhase: _cyclePhase, date: _date, updatedAt: _updatedAt, userId: _userId, ...draft } = log;
  return draft;
}

function toWorkoutDraft(log: WorkoutLogRecord): WorkoutDraft {
  const { cyclePhase: _cyclePhase, date: _date, updatedAt: _updatedAt, userId: _userId, ...draft } = log;
  return draft;
}

function toRecoveryDraft(log: RecoveryLogRecord): RecoveryDraft {
  const { date: _date, readinessScore: _readinessScore, updatedAt: _updatedAt, userId: _userId, ...draft } = log;
  return draft;
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getReadinessScore(log: RecoveryDraft) {
  const recoveryValues = [
    log.sleepQuality,
    log.hydrationLevel,
    6 - log.fatigueLevel,
    6 - log.stressLevel,
    6 - log.sorenessLevel,
  ];
  const total = recoveryValues.reduce((sum, value) => sum + value, 0);

  return Math.round((total / 25) * 100);
}

function getSaveLabel(tab: LogTab) {
  if (tab === 'food') return 'Save meal log';
  if (tab === 'workout') return 'Save workout log';
  return 'Save recovery log';
}

function getStatusMessage(tab: LogTab, state: StorageState) {
  if (state === 'loading') return 'Loading today\'s local logs.';
  if (state === 'saving') return 'Saving privately on this device.';
  if (state === 'error') return 'This log could not be saved locally. Try again.';
  return `${tab === 'food' ? 'Food' : tab === 'workout' ? 'Workout' : 'Recovery'} logs stay on this device.`;
}

function formatPhase(phase: CyclePhase) {
  return `${phase.slice(0, 1).toUpperCase()}${phase.slice(1)}`;
}

type FoodDraft = Omit<MealLogRecord, 'cyclePhase' | 'date' | 'updatedAt' | 'userId'>;
type WorkoutDraft = Omit<WorkoutLogRecord, 'cyclePhase' | 'date' | 'updatedAt' | 'userId'>;
type RecoveryDraft = Omit<RecoveryLogRecord, 'date' | 'readinessScore' | 'updatedAt' | 'userId'>;

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 20, borderWidth: 1, gap: 18, padding: 20 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  eyebrow: { color: '#497353', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 5 },
  phase: { backgroundColor: colors.sageSoft, borderRadius: 999, color: '#497353', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6 },
  tabs: { backgroundColor: colors.cream, borderRadius: 14, flexDirection: 'row', padding: 4 },
  tab: { alignItems: 'center', borderRadius: 10, flex: 1, minHeight: 38, justifyContent: 'center' },
  tabSelected: { backgroundColor: '#FFFFFF' },
  tabText: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  tabTextSelected: { color: colors.text },
  form: { gap: 18 },
  formGroup: { gap: 10 },
  formTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { alignItems: 'center', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 12 },
  choiceChipSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  choiceChipText: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  choiceChipTextSelected: { color: '#FFFFFF' },
  textInput: { backgroundColor: colors.cream, borderColor: colors.stone, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 14, minHeight: 46, paddingHorizontal: 12 },
  scaleGrid: { gap: 10 },
  scalePicker: { backgroundColor: colors.cream, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11 },
  scaleLabel: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  scaleDots: { flexDirection: 'row', gap: 7 },
  scaleDot: { backgroundColor: colors.stone, borderRadius: 6, height: 11, width: 11 },
  scaleDotActive: { backgroundColor: colors.sage },
  notesInput: { backgroundColor: colors.cream, borderColor: colors.stone, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 14, lineHeight: 20, minHeight: 82, padding: 12 },
  status: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
  saveButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 18, justifyContent: 'center', minHeight: 50 },
  saveButtonDisabled: { backgroundColor: '#6D6D6D' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
