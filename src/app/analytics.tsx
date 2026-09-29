import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  analyticsRepository,
  ExercisePRItem,
  ExerciseProgressionPoint,
  MuscleVolumeItem,
  WeeklyTrendItem,
} from '@/features/analytics/analytics-repository';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const tabBarHeight = useTabBarHeight();

  const [activeTab, setActiveTab] = useState<'prs' | 'volume' | 'progression'>('prs');
  const [prs, setPrs] = useState<ExercisePRItem[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeItem[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [progressionPoints, setProgressionPoints] = useState<ExerciseProgressionPoint[]>([]);
  const [searchPR, setSearchPR] = useState('');

  const loadData = useCallback(() => {
    try {
      const allPRs = analyticsRepository.getAllPRs();
      setPrs(allPRs);
      const volume = analyticsRepository.getMuscleGroupVolumeThisWeek();
      setMuscleVolume(volume);
      const trend = analyticsRepository.getWeeklyTrend(4);
      setWeeklyTrend(trend);

      if (allPRs.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(allPRs[0].exercise.id);
        setProgressionPoints(analyticsRepository.getExerciseProgression(allPRs[0].exercise.id));
      } else if (selectedExerciseId) {
        setProgressionPoints(analyticsRepository.getExerciseProgression(selectedExerciseId));
      }
    } catch (e) {
      console.error('Erro ao carregar analytics:', e);
    }
  }, [selectedExerciseId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectExercise = (id: string) => {
    haptics.light();
    setSelectedExerciseId(id);
    setProgressionPoints(analyticsRepository.getExerciseProgression(id));
  };

  const filteredPRs = prs.filter((p) =>
    p.exercise.name.toLowerCase().includes(searchPR.toLowerCase())
  );

  const maxTonnage = Math.max(...weeklyTrend.map((w) => w.tonnage), 1);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: tabBarHeight + Spacing.xxxl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ThemedText type="header">Evolução</ThemedText>
              <View style={[styles.glowBadge, { backgroundColor: theme.primaryDark, borderColor: theme.primary }]}>
                <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                  SOBRECARGA
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Monitore sua força, recordes e volume semanal de treino.
            </ThemedText>
          </View>

          {/* Seletor de Abas Internas */}
          <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Pressable
              style={[
                styles.tabItem,
                activeTab === 'prs' && { backgroundColor: theme.cardElevated, borderColor: theme.primary, borderWidth: 1 },
              ]}
              onPress={() => {
                haptics.light();
                setActiveTab('prs');
              }}>
              <ThemedText
                type="smallBold"
                style={{ color: activeTab === 'prs' ? theme.primary : theme.textSecondary }}>
                🏆 Recordes (PRs)
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.tabItem,
                activeTab === 'volume' && { backgroundColor: theme.cardElevated, borderColor: theme.primary, borderWidth: 1 },
              ]}
              onPress={() => {
                haptics.light();
                setActiveTab('volume');
              }}>
              <ThemedText
                type="smallBold"
                style={{ color: activeTab === 'volume' ? theme.primary : theme.textSecondary }}>
                📊 Volume
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.tabItem,
                activeTab === 'progression' && { backgroundColor: theme.cardElevated, borderColor: theme.primary, borderWidth: 1 },
              ]}
              onPress={() => {
                haptics.light();
                setActiveTab('progression');
              }}>
              <ThemedText
                type="smallBold"
                style={{ color: activeTab === 'progression' ? theme.primary : theme.textSecondary }}>
                📈 1RM Histórico
              </ThemedText>
            </Pressable>
          </View>

          {/* 1. ABA: RECORDES PESSOAIS (PRs) */}
          {activeTab === 'prs' && (
            <View style={styles.sectionContainer}>
              <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginRight: Spacing.xs }}>
                  🔍
                </ThemedText>
                <TextInput
                  value={searchPR}
                  onChangeText={setSearchPR}
                  placeholder="Buscar exercício..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>

              {filteredPRs.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="title" style={{ textAlign: 'center' }}>
                    Nenhum recorde registrado ainda
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
                    Conforme você executar e salvar suas séries na aba Treinar, seus recordes pessoais aparecerão aqui automaticamente.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.prList}>
                  {filteredPRs.map((item) => (
                    <View
                      key={item.exercise.id}
                      style={[styles.prCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <View style={styles.prCardTop}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                            {item.exercise.muscleGroup}
                          </ThemedText>
                          <ThemedText type="title" numberOfLines={1} style={{ marginTop: 2 }}>
                            {item.exercise.name}
                          </ThemedText>
                        </View>
                        <View style={styles.goldBadge}>
                          <ThemedText type="caption" style={{ color: '#F59E0B', fontWeight: '800' }}>
                            PR
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.prStatsRow}>
                        <View style={[styles.prStatItem, { backgroundColor: theme.backgroundElevated }]}>
                          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            CARGA MÁXIMA
                          </ThemedText>
                          <ThemedText type="title" style={{ color: theme.text, marginTop: 2 }}>
                            {item.maxWeight} kg
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textMuted }}>
                            {item.bestRepsAtMaxWeight} reps
                          </ThemedText>
                        </View>

                        <View style={[styles.prStatItem, { backgroundColor: theme.backgroundElevated }]}>
                          <ThemedText type="caption" style={{ color: theme.primaryHover }}>
                            1RM ESTIMADA
                          </ThemedText>
                          <ThemedText type="title" style={{ color: theme.primaryHover, marginTop: 2 }}>
                            ~{item.max1RM} kg
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textMuted }}>
                            Fórmula Epley
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.prCardFooter}>
                        <ThemedText type="caption" style={{ color: theme.textMuted }}>
                          {item.totalSetsLogged} séries registradas no total
                        </ThemedText>
                        <Pressable
                          onPress={() => {
                            setSelectedExerciseId(item.exercise.id);
                            setActiveTab('progression');
                            haptics.light();
                          }}
                          hitSlop={8}>
                          <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                            Ver Evolução →
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 2. ABA: VOLUME SEMANAL & POR GRUPO */}
          {activeTab === 'volume' && (
            <View style={styles.sectionContainer}>
              {/* Tendência Semanal */}
              <View style={[styles.trendCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                  TONELAGEM SEMANAL (ÚLTIMAS 4 SEMANAS)
                </ThemedText>
                <View style={styles.barsContainer}>
                  {weeklyTrend.map((w, idx) => {
                    const heightPercent = Math.max(12, Math.round((w.tonnage / maxTonnage) * 100));
                    return (
                      <View key={idx} style={styles.barColumn}>
                        <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 10 }}>
                          {w.tonnage > 1000 ? `${(w.tonnage / 1000).toFixed(1)}t` : `${w.tonnage}k`}
                        </ThemedText>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${heightPercent}%`,
                                backgroundColor: idx === weeklyTrend.length - 1 ? theme.primary : theme.cardElevated,
                                borderColor: theme.primary,
                                borderWidth: idx === weeklyTrend.length - 1 ? 1 : 0,
                              },
                            ]}
                          />
                        </View>
                        <ThemedText
                          type="caption"
                          style={{
                            color: idx === weeklyTrend.length - 1 ? theme.primary : theme.textMuted,
                            fontSize: 11,
                            fontWeight: idx === weeklyTrend.length - 1 ? '700' : '400',
                          }}>
                          {w.weekLabel}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Volume por Músculo */}
              <ThemedText type="subtitle" style={{ marginTop: Spacing.sm }}>
                Séries Válidas nesta Semana
              </ThemedText>

              {muscleVolume.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhuma série válida registrada nos últimos 7 dias.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.muscleList}>
                  {muscleVolume.map((mv) => {
                    const targetWeeklySets = 12; // Meta padrão de hipertrofia
                    const progress = Math.min(1, mv.setsCount / targetWeeklySets);

                    return (
                      <View
                        key={mv.muscleGroup}
                        style={[styles.muscleCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={styles.muscleCardHeader}>
                          <ThemedText type="smallBold">{mv.muscleGroup}</ThemedText>
                          <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                            {mv.setsCount} séries • {mv.tonnage} kg
                          </ThemedText>
                        </View>

                        {/* Barra de Progresso */}
                        <View style={styles.muscleProgressBarTrack}>
                          <View
                            style={[
                              styles.muscleProgressBarFill,
                              {
                                width: `${progress * 100}%`,
                                backgroundColor: mv.setsCount >= 10 ? '#22c55e' : theme.primary,
                              },
                            ]}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                          <ThemedText type="caption" style={{ color: theme.textMuted, fontSize: 10 }}>
                            {mv.setsCount >= 10 ? 'Faixa Ideal Atingida' : 'Construindo volume'}
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textMuted, fontSize: 10 }}>
                            Meta: 10-16 séries
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* 3. ABA: EVOLUÇÃO 1RM HISTÓRICO */}
          {activeTab === 'progression' && (
            <View style={styles.sectionContainer}>
              {/* Seletor de Exercício */}
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                SELECIONE O EXERCÍCIO
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseSelectScroll}>
                {prs.map((p) => {
                  const isSelected = p.exercise.id === selectedExerciseId;
                  return (
                    <Pressable
                      key={p.exercise.id}
                      onPress={() => handleSelectExercise(p.exercise.id)}
                      style={[
                        styles.exerciseSelectChip,
                        {
                          backgroundColor: isSelected ? theme.cardElevated : theme.card,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: isSelected ? theme.primary : theme.text }}>
                        {p.exercise.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {progressionPoints.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Selecione um exercício que já possua séries registradas para visualizar a linha do tempo.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.timelineContainer}>
                  <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                      PONTOS DE PROGRESSÃO ({progressionPoints.length})
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      Histórico de séries válidas e força estimada calculada.
                    </ThemedText>
                  </View>

                  {progressionPoints.map((pt, idx) => (
                    <View
                      key={idx}
                      style={[styles.timelineItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
                        <View>
                          <ThemedText type="smallBold">{pt.weightKg} kg × {pt.reps} reps</ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            {pt.date}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.timelineRight}>
                        <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                          1RM: ~{pt.estimated1RM} kg
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glowBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    gap: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.xs,
    fontSize: 14,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prList: {
    gap: Spacing.sm,
  },
  prCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  prCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goldBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  prStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prStatItem: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    alignItems: 'center',
    gap: 2,
  },
  prCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  trendCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 24,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.xs,
  },
  muscleList: {
    gap: Spacing.sm,
  },
  muscleCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  muscleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  muscleProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  exerciseSelectScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  exerciseSelectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  timelineContainer: {
    gap: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineRight: {
    alignItems: 'flex-end',
  },
});
