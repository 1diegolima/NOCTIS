import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <ThemedText type="header" style={styles.brandTitle}>
                NOCTIS
              </ThemedText>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Construa disciplina em silêncio.
            </ThemedText>
          </View>

          {/* Card Principal: Iniciar Treino */}
          <View
            style={[
              styles.mainCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}>
            <View style={styles.cardHeader}>
              <ThemedText type="caption" style={{ color: theme.primary }}>
                Sessão de Hoje
              </ThemedText>
              <ThemedText type="caption">Sem treino ativo</ThemedText>
            </View>

            <View style={styles.cardBody}>
              <ThemedText type="title" style={styles.cardTitle}>
                Pronto para treinar?
              </ThemedText>
              <ThemedText type="default" style={{ color: theme.textSecondary }}>
                Registre suas séries, repetições e cargas com rapidez e precisão.
              </ThemedText>
            </View>

            <Pressable
              onPress={() => router.push('/explore')}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.actionButtonText}>
                Iniciar Novo Treino
              </ThemedText>
            </Pressable>
          </View>

          {/* Resumo da Semana */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Resumo da Semana</ThemedText>
          </View>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <ThemedText type="caption">Treinos</ThemedText>
              <ThemedText type="metricValue" style={{ marginTop: Spacing.xs }}>
                0
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                esta semana
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <ThemedText type="caption">Séries</ThemedText>
              <ThemedText type="metricValue" style={{ marginTop: Spacing.xs }}>
                0
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                concluídas
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}>
              <ThemedText type="caption">Volume</ThemedText>
              <ThemedText type="metricValue" style={{ marginTop: Spacing.xs }}>
                0 <ThemedText type="small" style={{ color: theme.textMuted }}>kg</ThemedText>
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                acumulado
              </ThemedText>
            </View>
          </View>

          {/* Treinos Recentes / Histórico Inicial */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Últimos Treinos</ThemedText>
          </View>

          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder },
            ]}>
            <ThemedText type="default" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Nenhum treino registrado ainda.
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted, textAlign: 'center', marginTop: 4 }}>
              Seus treinos finalizados aparecerão aqui automaticamente.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: BottomTabInset + Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    gap: 4,
    marginTop: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandTitle: {
    letterSpacing: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mainCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBody: {
    gap: Spacing.xs,
  },
  cardTitle: {
    letterSpacing: -0.3,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  emptyStateCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
