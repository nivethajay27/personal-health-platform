import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  background: '#FCFBF8',
  stone: '#E8E4DE',
  text: '#2D2D2D',
  secondaryText: '#727272',
  sage: '#7FAF8A',
  sageSoft: '#E5F1E6',
  lavenderSoft: '#F0ECFA',
};

const patterns = [
  {
    category: 'Recovery',
    color: colors.sage,
    message: 'Fuller nights of sleep often appear alongside steadier energy.',
  },
  {
    category: 'Nutrition',
    color: '#8D7AB7',
    message: 'Your luteal starter days pair complex carbs with magnesium-rich foods.',
  },
  {
    category: 'Movement',
    color: '#B47A52',
    message: 'Gentle movement appears most often when your energy is lower.',
  },
];

export function MobileInsightsScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>YOUR PATTERNS</Text>
          <Text style={styles.title}>Insights, with context.</Text>
          <Text style={styles.description}>
            These starter observations connect your cycle, recovery, food, and movement without making medical claims.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>STARTER HISTORY</Text>
            <Text style={styles.summaryValue}>3 cycles</Text>
            <Text style={styles.summaryText}>Enough history to begin noticing trends, with room for your own logs.</Text>
          </View>

          <View style={styles.patterns}>
            {patterns.map((pattern) => (
              <View key={pattern.category} style={styles.patternCard}>
                <View style={[styles.patternMarker, { backgroundColor: pattern.color }]} />
                <View style={styles.patternCopy}>
                  <Text style={styles.patternCategory}>{pattern.category}</Text>
                  <Text style={styles.patternMessage}>{pattern.message}</Text>
                  <Text style={styles.patternSource}>Starter pattern</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>A thoughtful starting point</Text>
            <Text style={styles.noteText}>
              Insights describe logged patterns. They do not diagnose, predict fertility, or replace medical care.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { gap: 22, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 118 },
  eyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 29, fontWeight: '700', marginTop: -14 },
  description: { color: colors.secondaryText, fontSize: 14, lineHeight: 21, marginTop: -10 },
  summaryCard: { backgroundColor: colors.lavenderSoft, borderRadius: 22, gap: 6, padding: 22 },
  summaryLabel: { color: '#6A5E87', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: colors.text, fontSize: 28, fontWeight: '700' },
  summaryText: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  patterns: { gap: 12 },
  patternCard: { backgroundColor: '#FFFFFF', borderColor: colors.stone, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 18 },
  patternMarker: { borderRadius: 999, height: 10, marginTop: 5, width: 10 },
  patternCopy: { flex: 1, gap: 5 },
  patternCategory: { color: colors.text, fontSize: 13, fontWeight: '700' },
  patternMessage: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  patternSource: { color: colors.secondaryText, fontSize: 12, marginTop: 2 },
  noteCard: { backgroundColor: colors.sageSoft, borderRadius: 18, gap: 7, padding: 20 },
  noteTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  noteText: { color: '#556357', fontSize: 13, lineHeight: 19 },
});
