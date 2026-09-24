import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { WorkoutSession } from '@/database/schema';
import { workoutRepository } from '@/features/workouts/workout-repository';
import { useTheme } from '@/hooks/use-theme';
import { useActiveWorkoutStore } from '@/stores/active-workout-store';

export default function HomeScreen() {
  const theme = useTheme();
  const activeWorkout = useActiveWorkoutStore((s) => s.activeWorkout);
  const startNewWorkout = useActiveWorkoutStore((s) => s.startNewWorkout);
  const initialize = useActiveWorkoutStore((s) => s.initialize);

  const [summary, setSummary] = useState({ workoutsCount: 0, setsCount: 0, totalTonnage: 0 });
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);

  const loadDashboardData = useCallback(() => {
    try {
      initialize();
      const weekly = workoutRepository.getWeeklySummary();
      const all = workoutRepository.getAll();
      setSummary(weekly);
      setRecentWorkouts(all.slice(0, 5));
    } catch (e) {
      console.error('Erro ao carregar dados do painel:', e);
    }
  }, [initialize]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleStartWorkout = () => {
    if (!activeWorkout) {
      startNewWorkout();
    }
    router.push('/explore');
  };

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

          {/* Card Principal: Treino */}
          <View
            style={[
              styles.mainCard,
              {
                backgroundColor: theme.card,
                borderColor: activeWorkout ? theme.primary : theme.cardBorder,
              },
            ]}>
            <View style={styles.cardHeader}>
              <ThemedText type="caption" style={{ color: activeWorkout ? theme.primary : theme.textSecondary }}>
                {activeWorkout ? 'Treino em Andamento' : 'Sessão de Hoje'}
              </ThemedText>
              <ThemedText type="caption">
                {activeWorkout ? `${activeWorkout.sets.length} séries registradas` : 'Pronto para iniciar'}
              </ThemedText>
            </View>

            <View style={styles.cardBody}>
              <ThemedText type="title" style={styles.cardTitle}>
                {activeWorkout ? activeWorkout.name : 'Iniciar Novo Treino'}
              </ThemedText>
              <ThemedText type="default" style={{ color: theme.textSecondary }}>
                {activeWorkout
                  ? 'Você possui uma sessão ativa. Continue registrando suas cargas e repetições.'
                  : 'Registre suas séries, repetições e cargas com rapidez e precisão.'}
              </ThemedText>
            </View>

            <Pressable
              onPress={handleStartWorkout}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.actionButtonText}>
                {activeWorkout ? 'Continuar Treino Ativo →' : 'Iniciar Treino'}
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
                {summary.workoutsCount}
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
                {summary.setsCount}
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
                {summary.totalTonnage} <ThemedText type="small" style={{ color: theme.textMuted }}>kg</ThemedText>
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                acumulado
              </ThemedText>
            </View>
          </View>

          {/* Histórico Recente */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Últimos Treinos</ThemedText>
          </View>

          {recentWorkouts.length === 0 ? (
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
          ) : (
            <View style={styles.workoutList}>
              {recentWorkouts.map((w) => (
                <View
                  key={w.id}
                  style={[
                    styles.workoutHistoryItem,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <View style={styles.historyItemTop}>
                    <ThemedText type="smallBold">{w.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textMuted }}>
                      {new Date(w.startedAt).toLocaleDateString('pt-BR')}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    {w.completedAt ? 'Concluído' : 'Em andamento'}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
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
  workoutList: {
    gap: Spacing.sm,
  },
  workoutHistoryItem: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
