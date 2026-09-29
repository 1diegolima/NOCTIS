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

import { BackupModal } from '@/components/backup-modal';
import { ProgressionChart } from '@/components/progression-chart';
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
  const [chartMetric, setChartMetric] = useState<'estimated1RM' | 'weightKg'>('estimated1RM');
  const [searchPR, setSearchPR] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);

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
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
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
                <View style={{ flex: 1 }}>
                  <ThemedText type="header">Evolução</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Monitore sua força, recordes e volume de treino.
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setShowBackupModal(true);
                  }}
                  style={[styles.backupBtn, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primaryHover }}>
                    💾 Backup
                  </ThemedText>
                </Pressable>
              </View>
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
                📈 Gráfico & 1RM
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

          {/* 2. ABA: VOLUME SEMANAL & POR GRUPO COM ALERTAS */}
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

              {/* Volume por Músculo com Alertas de Sobrecarga / Volume Ótimo */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
                <ThemedText type="subtitle">
                  Volume por Grupo Muscular
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textMuted }}>
                  Últimos 7 dias
                </ThemedText>
              </View>

              {muscleVolume.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhuma série válida registrada nos últimos 7 dias.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.muscleList}>
                  {muscleVolume.map((mv) => {
                    const isBelow = mv.setsCount < 10;
                    const isOptimal = mv.setsCount >= 10 && mv.setsCount <= 20;
                    const isHigh = mv.setsCount > 20;
                    const targetWeeklySets = 16;
                    const progress = Math.min(1, mv.setsCount / targetWeeklySets);

                    return (
                      <View
                        key={mv.muscleGroup}
                        style={[
                          styles.muscleCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: isHigh ? 'rgba(239, 68, 68, 0.4)' : isOptimal ? 'rgba(34, 197, 94, 0.4)' : theme.cardBorder,
                          },
                        ]}>
                        <View style={styles.muscleCardHeader}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{mv.muscleGroup}</ThemedText>
                            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700', marginTop: 2 }}>
                              {mv.setsCount} séries válidas • {mv.tonnage} kg acumulados
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.volumeBadge,
                              {
                                backgroundColor: isOptimal
                                  ? 'rgba(34, 197, 94, 0.15)'
                                  : isHigh
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(234, 179, 8, 0.15)',
                                borderColor: isOptimal
                                  ? 'rgba(34, 197, 94, 0.4)'
                                  : isHigh
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : 'rgba(234, 179, 8, 0.4)',
                              },
                            ]}>
                            <ThemedText
                              type="caption"
                              style={{
                                color: isOptimal ? '#22c55e' : isHigh ? '#EF4444' : '#EAB308',
                                fontWeight: '700',
                                fontSize: 11,
                              }}>
                              {isOptimal ? 'Faixa Ótima' : isHigh ? 'Volume Alto' : 'Construindo'}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Barra de Progresso */}
                        <View style={styles.muscleProgressBarTrack}>
                          <View
                            style={[
                              styles.muscleProgressBarFill,
                              {
                                width: `${progress * 100}%`,
                                backgroundColor: isOptimal ? '#22c55e' : isHigh ? '#EF4444' : theme.primary,
                              },
                            ]}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <ThemedText type="caption" style={{ color: isBelow ? '#EAB308' : isOptimal ? '#22c55e' : '#EF4444', fontSize: 10, fontWeight: '600' }}>
                            {isBelow ? '⚠️ Abaixo do MEV (<10 séries)' : isOptimal ? '✅ Faixa ideal de hipertrofia' : '🔴 Acima do MRV (>20 séries — Monitore)'}
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textMuted, fontSize: 10 }}>
                            Alvo: 10-20 séries/sem
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* 3. ABA: EVOLUÇÃO GRÁFICA & 1RM HISTÓRICO */}
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
                    Selecione um exercício que já possua séries registradas para visualizar a evolução gráfica.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.timelineContainer}>
                  {/* Gráfico de Linha de Progressão */}
                  <View style={[styles.chartContainerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.chartHeaderRow}>
                      <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                        CURVA DE PROGRESSÃO VISUAL
                      </ThemedText>
                      {/* Alternador de Métrica */}
                      <View style={[styles.metricToggleContainer, { backgroundColor: theme.backgroundElevated }]}>
                        <Pressable
                          onPress={() => {
                            haptics.light();
                            setChartMetric('estimated1RM');
                          }}
                          style={[
                            styles.metricToggleBtn,
                            chartMetric === 'estimated1RM' && { backgroundColor: theme.primary },
                          ]}>
                          <ThemedText
                            type="caption"
                            style={{
                              color: chartMetric === 'estimated1RM' ? '#FFFFFF' : theme.textMuted,
                              fontWeight: chartMetric === 'estimated1RM' ? '700' : '400',
                              fontSize: 10,
                            }}>
                            1RM
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            haptics.light();
                            setChartMetric('weightKg');
                          }}
                          style={[
                            styles.metricToggleBtn,
                            chartMetric === 'weightKg' && { backgroundColor: theme.primary },
                          ]}>
                          <ThemedText
                            type="caption"
                            style={{
                              color: chartMetric === 'weightKg' ? '#FFFFFF' : theme.textMuted,
                              fontWeight: chartMetric === 'weightKg' ? '700' : '400',
                              fontSize: 10,
                            }}>
                            Carga
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>

                    <ProgressionChart points={progressionPoints} metricKey={chartMetric} />
                  </View>

                  {/* Resumo e Lista de Pontos */}
                  <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                      REGISTROS INDIVIDUAIS ({progressionPoints.length})
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      Histórico detalhado das séries válidas executadas.
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

      {/* MODAL DE BACKUP & EXPORTAÇÃO */}
      <BackupModal
        visible={showBackupModal}
        onClose={() => {
          setShowBackupModal(false);
          loadData();
        }}
      />
    </View>
  </Pressable>
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
  backupBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
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
  volumeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  chartContainerCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricToggleContainer: {
    flexDirection: 'row',
    borderRadius: Radius.xs,
    padding: 2,
    gap: 2,
  },
  metricToggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
