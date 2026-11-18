import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildCycleDay, getCycleSummary } from '@/core';
import { loadEnergyCheckIn, saveEnergyCheckIn } from '@/storage/mobile-database';

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

const demoCycle = {
  id: 'mobile_demo_cycle',
  userId: 'mobile_demo_user',
  startDate: '2026-06-12',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  createdAt: '2026-06-12T09:00:00.000Z',
  updatedAt: '2026-07-05T09:00:00.000Z',
};

const cycleSummary = getCycleSummary(
  buildCycleDay({ cycle: demoCycle, targetDate: '2026-07-05' }),
);
const CHECK_IN_DATE = '2026-07-05';
const USER_ID = 'mobile_demo_user';

const energyOptions = [
  { label: 'Low', value: 2 },
  { label: 'Steady', value: 3 },
  { label: 'Good', value: 4 },
  { label: 'High', value: 5 },
] as const;

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
  currentEnergyLabel,
  storageState,
}: {
  currentEnergyLabel?: string;
  storageState: 'error' | 'loading' | 'ready' | 'saving';
}) {
  if (storageState === 'loading') return 'Loading your check-in from this device.';
  if (storageState === 'saving') return 'Saving privately on this device.';
  if (storageState === 'error') return 'Your check-in could not be saved locally. Try again.';
  if (currentEnergyLabel) return `${currentEnergyLabel} energy saved privately on this device.`;

  return 'Choose the option that feels closest today.';
}

export function MobileHomeScreen() {
  const [energy, setEnergy] = useState<number | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [storageState, setStorageState] = useState<'error' | 'loading' | 'ready' | 'saving'>('loading');
  const currentEnergyLabel = useMemo(
    () => energyOptions.find((option) => option.value === energy)?.label,
    [energy],
  );

  useEffect(() => {
    let isMounted = true;

    void loadEnergyCheckIn({ date: CHECK_IN_DATE, userId: USER_ID })
      .then((checkIn) => {
        if (!isMounted) return;

        setEnergy(checkIn?.energyLevel ?? null);
        setStorageState('ready');
      })
      .catch(() => {
        if (isMounted) setStorageState('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleEnergySelection(energyLevel: number) {
    if (storageState === 'saving') return;

    const previousEnergy = energy;
    setEnergy(energyLevel);
    setStorageState('saving');

    try {
      await saveEnergyCheckIn({
        date: CHECK_IN_DATE,
        energyLevel,
        userId: USER_ID,
      });
      setStorageState('ready');
    } catch {
      setEnergy(previousEnergy);
      setStorageState('error');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CYCLE COMPANION</Text>
              <Text style={styles.greeting}>{getGreeting()}, Anaya</Text>
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
                Day {cycleSummary.cycleDayNumber} of your cycle. This phase is an estimate, not a diagnosis.
              </Text>
            </View>
            <View style={styles.ring}>
              <View style={styles.ringInner}>
                <Text style={styles.ringDay}>DAY</Text>
                <Text style={styles.ringNumber}>{cycleSummary.cycleDayNumber}</Text>
                <Text style={styles.ringDetail}>of 28</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineLabel}>LUTEAL PHASE</Text>
              <Text style={styles.timelineMeta}>Estimated</Text>
            </View>
            <View style={styles.timelineDots}>
              {Array.from({ length: 12 }, (_, index) => {
                const day = index + 17;
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
              <Text style={styles.sectionDescription}>A quick check-in helps you notice patterns over time.</Text>
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
              <Text style={styles.checkInTitle}>Energy right now</Text>
              <View style={styles.energyOptions}>
                {energyOptions.map((option) => {
                  const selected = option.value === energy;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={option.label}
                      disabled={storageState === 'saving'}
                      onPress={() => void handleEnergySelection(option.value)}
                      style={({ pressed }) => [
                        styles.energyOption,
                        selected && styles.energyOptionSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.energyOptionText, selected && styles.energyOptionTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.checkInHint}>
                {getCheckInMessage({ currentEnergyLabel, storageState })}
              </Text>
            </View>
          ) : (
            <View style={styles.metricGrid}>
              <MetricCard detail="Last night" label="Sleep" value="7.4h" />
              <MetricCard detail="Today" label="Readiness" value="76%" />
              <MetricCard detail="So far" label="Hydration" value="3 / 5" />
            </View>
          )}

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

function MetricCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
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
  metricValue: { color: colors.text, fontSize: 23, fontWeight: '700', marginTop: 12 },
  metricDetail: { color: colors.secondaryText, fontSize: 11, marginTop: 4 },
  checkInCard: { backgroundColor: colors.cream, borderRadius: 20, gap: 14, padding: 20 },
  checkInTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  energyOptions: { flexDirection: 'row', gap: 8 },
  energyOption: { alignItems: 'center', borderColor: colors.stone, borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  energyOptionSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  energyOptionText: { color: colors.secondaryText, fontSize: 12, fontWeight: '700' },
  energyOptionTextSelected: { color: '#FFFFFF' },
  checkInHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
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
