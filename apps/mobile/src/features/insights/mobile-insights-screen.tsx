import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CyclePhase, Insight } from '@/core';
import { buildMobileRuleBasedInsights } from '@/features/insights/mobile-insight-engine';
import { useMobileProfile } from '@/features/profile/mobile-profile-context';
import {
  loadDailyCheckIn,
  loadMealLog,
  loadRecentDailyCheckIns,
  loadRecoveryLog,
  loadWorkoutLog,
  type DailyCheckInRecord,
  type MealLogRecord,
  type RecoveryLogRecord,
  type WorkoutLogRecord,
} from '@/storage/mobile-database';
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

type PatternState = 'error' | 'loading' | 'ready';
type PatternData = {
  checkIns: DailyCheckInRecord[];
  insights: Insight[];
  meal: MealLogRecord | null;
  recovery: RecoveryLogRecord | null;
  todayCheckIn: DailyCheckInRecord | null;
  workout: WorkoutLogRecord | null;
};

const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function MobileInsightsScreen() {
  const { profile } = useMobileProfile();
  const [data, setData] = useState<PatternData | null>(null);
  const [state, setState] = useState<PatternState>('loading');
  const today = getLocalDateString();
  const userId = profile?.userId;

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    void getPatternData({ date: today, userId })
      .then((patternData) => {
        if (!isMounted) return;

        setData(patternData);
        setState('ready');
      })
      .catch(() => {
        if (isMounted) setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [today, userId]);

  function refreshPatterns() {
    if (!userId) return;
    setState('loading');
    void getPatternData({ date: today, userId })
      .then((patternData) => {
        setData(patternData);
        setState('ready');
      })
      .catch(() => setState('error'));
  }

  const recentCheckIns = useMemo(
    () => (data?.checkIns ?? []).slice(0, 7).reverse(),
    [data?.checkIns],
  );
  const symptomCounts = useMemo(
    () => getSymptomCounts(data?.checkIns ?? []),
    [data?.checkIns],
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR PATTERNS</Text>
              <Text style={styles.title}>Your data, in context.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={refreshPatterns}
              style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>
          <Text style={styles.description}>
            These views use logs saved on this device. They describe patterns, not diagnoses or predictions.
          </Text>

          {state === 'loading' ? (
            <StatusCard title="Loading your local patterns" />
          ) : state === 'error' ? (
            <StatusCard title="Your local patterns are unavailable right now" />
          ) : (
            <>
              <TodaySnapshot data={data} />
              <LocalInsights insights={data?.insights ?? []} />
              <WeeklyRhythm checkIns={recentCheckIns} />
              <SymptomPattern counts={symptomCounts} hasHistory={data?.checkIns.length ?? 0} />
              <RecoverySummary recovery={data?.recovery ?? null} />
            </>
          )}

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Private by default</Text>
            <Text style={styles.noteText}>
              Your check-ins and logs remain on this device. More history makes these summaries more useful.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

async function getPatternData({ date, userId }: { date: string; userId: string }): Promise<PatternData> {
  const [todayCheckIn, meal, recovery, checkIns, workout, insights] = await Promise.all([
    loadDailyCheckIn({ date, userId }),
    loadMealLog({ date, userId }),
    loadRecoveryLog({ date, userId }),
    loadRecentDailyCheckIns({ limit: 90, userId }),
    loadWorkoutLog({ date, userId }),
    buildMobileRuleBasedInsights(userId),
  ]);

  return { checkIns, insights, meal, recovery, todayCheckIn, workout };
}

function TodaySnapshot({ data }: { data: PatternData | null }) {
  const energy = data?.todayCheckIn ? energyLabel(data.todayCheckIn.energyLevel) : 'Not logged';
  const meal = data?.meal?.name || (data?.meal ? formatMealType(data.meal.mealType) : 'Not logged');
  const workout = data?.workout ? formatWorkoutType(data.workout.type) : 'Not logged';

  return (
    <View style={styles.snapshotCard}>
      <Text style={styles.sectionEyebrow}>TODAY AT A GLANCE</Text>
      <View style={styles.snapshotGrid}>
        <SnapshotItem label="Energy" value={energy} />
        <SnapshotItem label="Food" value={meal} />
        <SnapshotItem label="Movement" value={workout} />
      </View>
    </View>
  );
}

function LocalInsights({ insights }: { insights: Insight[] }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>INSIGHTS FROM YOUR LOGS</Text>
      <Text style={styles.sectionTitle}>Small patterns worth noticing</Text>
      {insights.length ? (
        <View style={styles.insightList}>
          {insights.slice(0, 2).map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.message}</Text>
              <Text style={styles.insightSources}>Based on {insight.sources.map(formatSource).join(', ')}</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState text="Keep logging for a few days. Insights appear only when there is enough history for a meaningful pattern." />
      )}
    </View>
  );
}

function WeeklyRhythm({ checkIns }: { checkIns: DailyCheckInRecord[] }) {
  const hasTrend = checkIns.length >= 2;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>7-DAY RHYTHM</Text>
      <Text style={styles.sectionTitle}>Energy and sleep</Text>
      {hasTrend ? (
        <View style={styles.chart}>
          {checkIns.map((checkIn) => (
            <View key={checkIn.date} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.energyBar, { height: `${checkIn.energyLevel * 20}%` }]} />
              </View>
              <Text style={styles.chartValue}>{checkIn.sleepHours ? `${checkIn.sleepHours}h` : '-'}</Text>
              <Text style={styles.chartLabel}>{formatShortDate(checkIn.date)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState text="Save check-ins on more days to see your energy and sleep rhythm here." />
      )}
    </View>
  );
}

function SymptomPattern({
  counts,
  hasHistory,
}: {
  counts: Record<CyclePhase, number>;
  hasHistory: number;
}) {
  const hasSymptoms = Object.values(counts).some((count) => count > 0);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>SYMPTOMS BY PHASE</Text>
      <Text style={styles.sectionTitle}>What shows up when</Text>
      {hasHistory && hasSymptoms ? (
        <View style={styles.phaseList}>
          {phases.map((phase) => (
            <View key={phase} style={styles.phaseRow}>
              <View style={[styles.phaseMarker, { backgroundColor: phaseColor(phase) }]} />
              <Text style={styles.phaseName}>{formatPhase(phase)}</Text>
              <Text style={styles.phaseCount}>{counts[phase]} logged</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState text="Log any symptoms in a daily check-in to begin seeing phase-based patterns." />
      )}
    </View>
  );
}

function RecoverySummary({ recovery }: { recovery: RecoveryLogRecord | null }) {
  return (
    <View style={styles.recoveryCard}>
      <View>
        <Text style={styles.recoveryEyebrow}>RECOVERY SUMMARY</Text>
        <Text style={styles.recoveryTitle}>Readiness today</Text>
      </View>
      {recovery ? (
        <View style={styles.scoreWrap}>
          <Text style={styles.score}>{recovery.readinessScore}</Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>
      ) : (
        <Text style={styles.recoveryEmpty}>Add a recovery log to calculate a local readiness summary.</Text>
      )}
    </View>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.snapshotItem}>
      <Text style={styles.snapshotLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.snapshotValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function StatusCard({ title }: { title: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.emptyText}>Your saved data never leaves this device.</Text>
    </View>
  );
}

function getSymptomCounts(checkIns: DailyCheckInRecord[]) {
  return checkIns.reduce<Record<CyclePhase, number>>(
    (counts, checkIn) => ({
      ...counts,
      [checkIn.cyclePhase]: counts[checkIn.cyclePhase] + checkIn.symptoms.length,
    }),
    { follicular: 0, luteal: 0, menstrual: 0, ovulatory: 0 },
  );
}

function energyLabel(energyLevel: number) {
  if (energyLevel <= 2) return 'Low';
  if (energyLevel === 3) return 'Steady';
  if (energyLevel === 4) return 'Good';
  return 'High';
}

function formatMealType(mealType: string) {
  return `${mealType.slice(0, 1).toUpperCase()}${mealType.slice(1)}`;
}

function formatWorkoutType(type: string) {
  return type.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T00:00:00`),
  );
}

function formatPhase(phase: CyclePhase) {
  return `${phase.slice(0, 1).toUpperCase()}${phase.slice(1)}`;
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

function formatSource(source: Insight['sources'][number]) {
  const labels: Record<Insight['sources'][number], string> = {
    cycle: 'cycle',
    daily_check_in: 'check-ins',
    meals: 'food logs',
    recovery: 'recovery logs',
    symptoms: 'symptom logs',
    workouts: 'workout logs',
  };

  return labels[source];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { gap: 20, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 118 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  eyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 29, fontWeight: '700', marginTop: 6 },
  description: { color: colors.secondaryText, fontSize: 14, lineHeight: 21, marginTop: -7 },
  refreshButton: { backgroundColor: colors.cream, borderRadius: 14, minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  refreshButtonText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  snapshotCard: { backgroundColor: colors.lavenderSoft, borderRadius: 22, gap: 15, padding: 20 },
  sectionEyebrow: { color: '#6A5E87', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  snapshotGrid: { flexDirection: 'row', gap: 8 },
  snapshotItem: { flex: 1, gap: 6 },
  snapshotLabel: { color: colors.secondaryText, fontSize: 11 },
  snapshotValue: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  sectionCard: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 20, borderWidth: 1, gap: 8, padding: 20 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  insightList: { gap: 10, marginTop: 9 },
  insightCard: { backgroundColor: colors.cream, borderRadius: 14, gap: 6, padding: 14 },
  insightTitle: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  insightText: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
  insightSources: { color: '#497353', fontSize: 11, fontWeight: '700', marginTop: 2 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, height: 168, marginTop: 10 },
  chartColumn: { alignItems: 'center', flex: 1, gap: 6, height: '100%', justifyContent: 'flex-end' },
  barTrack: { backgroundColor: colors.cream, borderRadius: 8, flex: 1, justifyContent: 'flex-end', maxWidth: 26, overflow: 'hidden', width: '100%' },
  energyBar: { backgroundColor: colors.sage, borderRadius: 8, width: '100%' },
  chartValue: { color: colors.secondaryText, fontSize: 10 },
  chartLabel: { color: colors.secondaryText, fontSize: 10 },
  emptyText: { color: colors.secondaryText, fontSize: 13, lineHeight: 19, marginTop: 7 },
  phaseList: { gap: 11, marginTop: 9 },
  phaseRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  phaseMarker: { borderRadius: 999, height: 10, width: 10 },
  phaseName: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '700' },
  phaseCount: { color: colors.secondaryText, fontSize: 12 },
  recoveryCard: { alignItems: 'center', backgroundColor: colors.sageSoft, borderRadius: 20, flexDirection: 'row', gap: 16, justifyContent: 'space-between', padding: 20 },
  recoveryEyebrow: { color: '#497353', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  recoveryTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 6 },
  scoreWrap: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, minHeight: 72, justifyContent: 'center', minWidth: 72, paddingHorizontal: 10 },
  score: { color: colors.text, fontSize: 25, fontWeight: '700' },
  scoreLabel: { color: colors.secondaryText, fontSize: 9 },
  recoveryEmpty: { color: '#556357', flex: 1, fontSize: 12, lineHeight: 18, textAlign: 'right' },
  statusCard: { backgroundColor: colors.cream, borderRadius: 20, gap: 5, padding: 20 },
  statusTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  noteCard: { backgroundColor: colors.cream, borderRadius: 18, gap: 7, padding: 20 },
  noteTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  noteText: { color: '#556357', fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
