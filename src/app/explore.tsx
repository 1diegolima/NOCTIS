import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  FullRoutine,
  RoutineWorkoutWithExercises,
  routineRepository,
} from '@/features/routines/routine-repository';
import {
  calculatePreparationSets,
  PreparedSetSuggestion,
} from '@/features/workouts/warmup-algorithm';
import { workoutRepository, WorkoutWithSets } from '@/features/workouts/workout-repository';
import { useTheme } from '@/hooks/use-theme';
import { useActiveWorkoutStore } from '@/stores/active-workout-store';

export default function WorkoutsScreen() {
  const theme = useTheme();

  const {
    activeWorkout,
    weightInput,
    repsInput,
    initialize,
    startNewWorkout,
    setWeightInput,
    setRepsInput,
    logCurrentSet,
    deleteSet,
    finishCurrentWorkout,
    cancelCurrentWorkout,
  } = useActiveWorkoutStore();

  const [activeRoutine, setActiveRoutine] = useState<FullRoutine | null>(null);
  const [history, setHistory] = useState<WorkoutWithSets[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Timer de Descanso
  const [restTimer, setRestTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const loadData = useCallback(() => {
    initialize();
    const routine = routineRepository.getActiveRoutine();
    setActiveRoutine(routine);
    const all = workoutRepository.getAll();
    const full = all.map((w) => workoutRepository.getById(w.id)).filter(Boolean) as WorkoutWithSets[];
    setHistory(full);
  }, [initialize]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Exercícios da sessão ativa
  const currentWorkoutFromRoutine = activeRoutine?.workouts[0] ?? null;
  const activeExerciseList = currentWorkoutFromRoutine?.exercises ?? [];
  const currentRoutineExercise = activeExerciseList[currentExerciseIndex] ?? null;
  const currentExercise = currentRoutineExercise?.exercise ?? null;

  // Sugestões de Aquecimento e Feeder Sets calculadas pelo algoritmo
  const preparationSuggestions: PreparedSetSuggestion[] = currentExercise
    ? calculatePreparationSets({
        exercise: currentExercise,
        workingWeightKg: currentRoutineExercise?.workingWeightKg || 80,
        workingSetsCount: currentRoutineExercise?.workingSets || 2,
        targetRepsMin: currentRoutineExercise?.repsMin || 6,
        targetRepsMax: currentRoutineExercise?.repsMax || 10,
        isFirstExerciseOfWorkout: currentExerciseIndex === 0,
        isFirstExerciseOfMuscleGroup:
          currentExerciseIndex === 0 ||
          activeExerciseList[currentExerciseIndex - 1]?.exercise?.muscleGroup !==
            currentExercise.muscleGroup,
      })
    : [];

  const handleStartRoutineWorkout = (rw: RoutineWorkoutWithExercises) => {
    startNewWorkout(rw.name);
    setCurrentExerciseIndex(0);
    if (rw.exercises.length > 0 && rw.exercises[0].exercise) {
      useActiveWorkoutStore.getState().selectExercise(rw.exercises[0].exercise);
      setWeightInput(rw.exercises[0].workingWeightKg.toString());
      setRepsInput(rw.exercises[0].repsMin.toString());
    }
  };

  const handleSelectExerciseByOrder = (idx: number) => {
    setCurrentExerciseIndex(idx);
    const target = activeExerciseList[idx];
    if (target && target.exercise) {
      useActiveWorkoutStore.getState().selectExercise(target.exercise);
      setWeightInput(target.workingWeightKg.toString());
      setRepsInput(target.repsMin.toString());
    }
  };

  const handleLogWorkingSet = () => {
    const success = logCurrentSet();
    if (success) {
      // Inicia timer de descanso (120 segundos por padrão)
      setRestTimer(currentRoutineExercise?.restSeconds || 120);
    } else {
      Alert.alert('Atenção', 'Informe um peso e quantidade de repetições válidos.');
    }
  };

  const handleLogFeederSet = (suggestion: PreparedSetSuggestion) => {
    if (!currentExercise || !activeWorkout) return;
    setWeightInput(suggestion.weightKg.toString());
    setRepsInput(suggestion.reps.toString());
    logCurrentSet();
    setRestTimer(60); // Descanso menor para feeder sets
  };

  const handleFinish = () => {
    Alert.alert('Finalizar Treino', 'Deseja concluir e salvar este treino no histórico?', [
      { text: 'Continuar Treinando', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: () => {
          finishCurrentWorkout();
          setRestTimer(null);
          loadData();
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancelar Treino', 'Deseja descartar este treino em andamento?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          cancelCurrentWorkout();
          setRestTimer(null);
          loadData();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="header">
              {activeWorkout ? activeWorkout.name : 'Executar Treino'}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {activeWorkout
                ? 'Siga as séries de preparação e registre suas séries válidas.'
                : 'Escolha uma sessão da sua rotina para iniciar.'}
            </ThemedText>
          </View>

          {/* Banner de Timer de Descanso Ativo */}
          {restTimer !== null && (
            <View
              style={[
                styles.timerBanner,
                { backgroundColor: theme.primaryDark, borderColor: theme.primary },
              ]}>
              <View>
                <ThemedText type="caption" style={{ color: theme.primaryHover }}>
                  TEMPO DE DESCANSO
                </ThemedText>
                <ThemedText type="metricValue" style={{ color: '#FFFFFF' }}>
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setRestTimer(null)}
                style={[styles.skipTimerBtn, { backgroundColor: theme.cardElevated }]}>
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Pular Descanso ➔
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* MODO ATIVO: Treino em Execução */}
          {activeWorkout ? (
            <View style={styles.activeContainer}>
              {/* Barra de Ações Rápidas */}
              <View
                style={[
                  styles.sessionTopBar,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}>
                <View>
                  <ThemedText type="caption" style={{ color: theme.primary }}>
                    Sessão em Andamento
                  </ThemedText>
                  <ThemedText type="smallBold">{activeWorkout.sets.length} séries registradas</ThemedText>
                </View>
                <Pressable
                  onPress={handleFinish}
                  style={[styles.finishBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Finalizar Treino
                  </ThemedText>
                </Pressable>
              </View>

              {/* Lista de Exercícios da Sessão (Navegação Rápida) */}
              {activeExerciseList.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.exerciseNavScroll}>
                  {activeExerciseList.map((re, idx) => {
                    const isSelected = currentExerciseIndex === idx;
                    const setsDoneForThisEx = activeWorkout.sets.filter(
                      (s) => s.exerciseId === re.exerciseId
                    ).length;

                    return (
                      <Pressable
                        key={re.id}
                        onPress={() => handleSelectExerciseByOrder(idx)}
                        style={[
                          styles.exerciseNavChip,
                          {
                            backgroundColor: isSelected ? theme.cardElevated : theme.card,
                            borderColor: isSelected ? theme.primary : theme.cardBorder,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: isSelected ? theme.primary : theme.text }}>
                          #{idx + 1} {re.exercise?.name}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textMuted }}>
                          {setsDoneForThisEx}/{re.workingSets} válidas ({re.workingWeightKg}kg)
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Detalhes do Exercício Atual + Séries Preparatórias Calculadas */}
              {currentExercise && (
                <View style={styles.exerciseExecutionSection}>
                  <View
                    style={[
                      styles.exerciseTitleBox,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <ThemedText type="title">{currentExercise.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {currentExercise.muscleGroup} • {currentExercise.category} • Alvo:{' '}
                      {currentRoutineExercise?.workingSets} séries × {currentRoutineExercise?.repsMin}–
                      {currentRoutineExercise?.repsMax} reps @ {currentRoutineExercise?.workingWeightKg} kg
                    </ThemedText>
                  </View>

                  {/* Sugestões de Preparação e Feeder Sets */}
                  <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Plano de Séries & Preparação</ThemedText>
                  </View>

                  <View style={styles.prepList}>
                    {preparationSuggestions.map((sug, sIdx) => {
                      const isWorking = sug.type === 'working';
                      return (
                        <View
                          key={sIdx}
                          style={[
                            styles.prepRow,
                            {
                              backgroundColor: isWorking ? theme.cardElevated : theme.card,
                              borderColor: isWorking ? theme.primaryMuted : theme.cardBorder,
                            },
                          ]}>
                          <View style={styles.prepRowLeft}>
                            <View
                              style={[
                                styles.prepTypeBadge,
                                {
                                  backgroundColor:
                                    sug.type === 'warmup'
                                      ? '#3B82F620'
                                      : sug.type === 'feeder'
                                      ? '#F59E0B20'
                                      : theme.primaryDark,
                                },
                              ]}>
                              <ThemedText
                                type="caption"
                                style={{
                                  color:
                                    sug.type === 'warmup'
                                      ? '#60A5FA'
                                      : sug.type === 'feeder'
                                      ? '#FBBF24'
                                      : theme.primaryHover,
                                  fontWeight: '700',
                                }}>
                                {sug.label}
                              </ThemedText>
                            </View>
                            <ThemedText type="smallBold">
                              {sug.weightKg} kg × {sug.reps} reps
                            </ThemedText>
                          </View>

                          {!isWorking && (
                            <Pressable
                              onPress={() => handleLogFeederSet(sug)}
                              style={[styles.quickLogFeederBtn, { borderColor: theme.cardBorder }]}>
                              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                Feito ✓
                              </ThemedText>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Painel de Registro Rápido da Série Válida */}
                  <View
                    style={[
                      styles.logPanel,
                      { backgroundColor: theme.card, borderColor: theme.primary },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>
                      REGISTRAR SÉRIE VÁLIDA
                    </ThemedText>

                    <View style={styles.inputRow}>
                      <View style={styles.inputCol}>
                        <ThemedText type="caption">Carga Real (kg)</ThemedText>
                        <TextInput
                          value={weightInput}
                          onChangeText={setWeightInput}
                          keyboardType="numeric"
                          style={[
                            styles.realInput,
                            {
                              backgroundColor: theme.backgroundElevated,
                              borderColor: theme.cardBorder,
                              color: theme.text,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.inputCol}>
                        <ThemedText type="caption">Reps Realizadas</ThemedText>
                        <TextInput
                          value={repsInput}
                          onChangeText={setRepsInput}
                          keyboardType="number-pad"
                          style={[
                            styles.realInput,
                            {
                              backgroundColor: theme.backgroundElevated,
                              borderColor: theme.cardBorder,
                              color: theme.text,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <Pressable
                      onPress={handleLogWorkingSet}
                      style={[styles.bigLogBtn, { backgroundColor: theme.primary }]}>
                      <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                        + Confirmar Série Válida
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Histórico das Séries Registradas Nesta Sessão */}
                  <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Séries Feitas Neste Treino ({activeWorkout.sets.length})</ThemedText>
                  </View>

                  <View style={styles.loggedList}>
                    {activeWorkout.sets.map((s, idx) => (
                      <View
                        key={s.id}
                        style={[
                          styles.loggedItem,
                          { backgroundColor: theme.card, borderColor: theme.cardBorder },
                        ]}>
                        <View style={styles.loggedItemLeft}>
                          <ThemedText type="smallBold" style={{ color: theme.primary }}>
                            #{idx + 1}
                          </ThemedText>
                          <View>
                            <ThemedText type="smallBold">{s.exercise?.name}</ThemedText>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                              {s.weightKg} kg × {s.reps} reps
                            </ThemedText>
                          </View>
                        </View>
                        <Pressable onPress={() => deleteSet(s.id)} hitSlop={8}>
                          <ThemedText type="caption" style={{ color: theme.danger }}>
                            Excluir
                          </ThemedText>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Pressable
                onPress={handleCancel}
                style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Descartar Treino
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            /* MODO INATIVO: Selecionar Sessão da Divisão para Treinar */
            <View style={styles.inactiveContainer}>
              {activeRoutine ? (
                <View style={styles.routinePickSection}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Iniciar Sessão de Hoje</ThemedText>
                  </View>

                  <View style={styles.workoutsGrid}>
                    {activeRoutine.workouts.map((rw) => (
                      <Pressable
                        key={rw.id}
                        onPress={() => handleStartRoutineWorkout(rw)}
                        style={[
                          styles.workoutPickCard,
                          { backgroundColor: theme.card, borderColor: theme.cardBorder },
                        ]}>
                        <View style={styles.workoutPickTop}>
                          <ThemedText type="title">{rw.name}</ThemedText>
                          <ThemedText type="caption" style={{ color: theme.primary }}>
                            {rw.exercises.length} exercícios
                          </ThemedText>
                        </View>
                        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                          {rw.exercises.map((e) => e.exercise?.name).slice(0, 3).join(', ')}
                          {rw.exercises.length > 3 ? '...' : ''}
                        </ThemedText>
                        <View
                          style={[
                            styles.startChip,
                            { backgroundColor: theme.primaryDark, borderColor: theme.primary },
                          ]}>
                          <ThemedText type="smallBold" style={{ color: theme.primaryHover }}>
                            Iniciar Sessão →
                          </ThemedText>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyRoutineCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <ThemedText type="title">Configure sua Divisão de Treino</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    Para começar a treinar com o cálculo de séries preparatórias, configure sua divisão na aba Montar Treino.
                  </ThemedText>
                </View>
              )}

              {/* Histórico de Treinos Concluídos */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Histórico Recente</ThemedText>
              </View>

              {history.length === 0 ? (
                <View
                  style={[
                    styles.emptyRoutineCard,
                    { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder },
                  ]}>
                  <ThemedText type="default" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhum histórico salvo ainda.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {history.map((w) => (
                    <View
                      key={w.id}
                      style={[
                        styles.historyItemCard,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      ]}>
                      <View style={styles.historyItemHeader}>
                        <ThemedText type="title">{w.name}</ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textMuted }}>
                          {new Date(w.startedAt).toLocaleDateString('pt-BR')}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                        {w.sets.length} séries registradas
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: BottomTabInset + Spacing.xxxl,
    gap: Spacing.lg,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: 4,
  },
  timerBanner: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipTimerBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
  },
  activeContainer: {
    gap: Spacing.md,
  },
  sessionTopBar: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finishBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  exerciseNavScroll: {
    gap: Spacing.sm,
  },
  exerciseNavChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 160,
    gap: 2,
  },
  exerciseExecutionSection: {
    gap: Spacing.md,
  },
  exerciseTitleBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 2,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  prepList: {
    gap: Spacing.xs,
  },
  prepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  prepRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  prepTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  quickLogFeederBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  logPanel: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  realInput: {
    height: 48,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  bigLogBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedList: {
    gap: Spacing.xs,
  },
  loggedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  loggedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  inactiveContainer: {
    gap: Spacing.lg,
  },
  routinePickSection: {
    gap: Spacing.md,
  },
  workoutsGrid: {
    gap: Spacing.md,
  },
  workoutPickCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  workoutPickTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  emptyRoutineCard: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyItemCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
