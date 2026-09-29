import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ExerciseSelectorModal } from '@/components/exercise-selector-modal';
import { PlateCalculatorModal } from '@/components/plate-calculator-modal';
import { WorkoutDetailModal } from '@/components/workout-detail-modal';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  FullRoutine,
  RoutineWorkoutWithExercises,
  routineRepository,
} from '@/features/routines/routine-repository';
import {
  calculatePreparationSets,
  PreparedSetSuggestion,
} from '@/features/workouts/warmup-algorithm';
import { workoutRepository, WorkoutWithSets, calculateOneRepMax } from '@/features/workouts/workout-repository';
import { useRestTimer } from '@/contexts/rest-timer-context';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { useTheme } from '@/hooks/use-theme';
import { useActiveWorkoutStore } from '@/stores/active-workout-store';
import { haptics } from '@/utils/haptics';

export default function WorkoutsScreen() {
  const theme = useTheme();
  const tabBarHeight = useTabBarHeight();
  const { startTimer, stopTimer } = useRestTimer();

  const {
    activeWorkout,
    selectedExercise,
    weightInput,
    repsInput,
    sessionNotes,
    initialize,
    startNewWorkout,
    selectExercise,
    setWeightInput,
    setRepsInput,
    setSessionNotes,
    logCurrentSet,
    deleteSet,
    undoLastSet,
    finishCurrentWorkout,
    cancelCurrentWorkout,
  } = useActiveWorkoutStore();

  const [activeRoutine, setActiveRoutine] = useState<FullRoutine | null>(null);
  const [history, setHistory] = useState<WorkoutWithSets[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [weeklyWorkoutsCount, setWeeklyWorkoutsCount] = useState(0);
  const [previewWorkout, setPreviewWorkout] = useState<RoutineWorkoutWithExercises | null>(null);
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishedDurationMinutes, setFinishedDurationMinutes] = useState(1);
  const [showPlateCalcModal, setShowPlateCalcModal] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedHistoryWorkoutId, setSelectedHistoryWorkoutId] = useState<string | null>(null);
  const [prAlert, setPrAlert] = useState<{ exerciseName: string; weightKg: number; reps: number } | null>(null);

  // Timer de Descanso
  const [restTimer, setRestTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev !== null && prev > 1) {
            return prev - 1;
          }
          if (prev === 1) {
            haptics.timerDone();
          }
          return null;
        });
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
    // Contar treinos desta semana para calcular sessão sugerida
    const summary = workoutRepository.getWeeklySummary();
    setWeeklyWorkoutsCount(summary.workoutsCount);
    // Obter treinos de rotina já concluídos hoje
    const todayDone = workoutRepository.getCompletedRoutineWorkoutIdsToday();
    setCompletedTodayIds(todayDone);
  }, [initialize]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Sessão sugerida: rotação circular baseada em treinos feitos na semana
  const suggestedWorkoutIndex = activeRoutine
    ? weeklyWorkoutsCount % activeRoutine.workouts.length
    : 0;

  // Exercícios da sessão ativa (vinculados ao routineWorkoutId real da sessão)
  const currentWorkoutFromRoutine =
    activeRoutine?.workouts.find(
      (w) =>
        (activeWorkout?.routineWorkoutId && w.id === activeWorkout.routineWorkoutId) ||
        (activeWorkout?.name && w.name === activeWorkout.name)
    ) ??
    activeRoutine?.workouts[0] ??
    null;
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
    haptics.medium();
    startNewWorkout(rw.name, rw.id);
    setPreviewWorkout(null);
    setCurrentExerciseIndex(0);
    if (rw.exercises.length > 0 && rw.exercises[0].exercise) {
      useActiveWorkoutStore.getState().selectExercise(rw.exercises[0].exercise);
      setWeightInput(
        rw.exercises[0].workingWeightKg > 0 ? rw.exercises[0].workingWeightKg.toString() : ''
      );
      setRepsInput(rw.exercises[0].repsMin > 0 ? rw.exercises[0].repsMin.toString() : '');
    }
  };

  const handleSelectExerciseByOrder = (idx: number) => {
    haptics.light();
    setCurrentExerciseIndex(idx);
    const target = activeExerciseList[idx];
    if (target && target.exercise) {
      useActiveWorkoutStore.getState().selectExercise(target.exercise);
      setWeightInput(target.workingWeightKg > 0 ? target.workingWeightKg.toString() : '');
      setRepsInput(target.repsMin > 0 ? target.repsMin.toString() : '');
    }
  };

  // Séries completas da última sessão deste exercício (Ghost Sets)
  const currentExerciseLastSessionSets = currentExercise
    ? workoutRepository.getLastSessionSetsForExercise(currentExercise.id, activeWorkout?.id)
    : [];

  // Recorde Pessoal (PR) do exercício
  const currentExercisePR = currentExercise
    ? workoutRepository.getExercisePR(currentExercise.id)
    : null;

  // Ajustes rápidos de carga e repetições (+/-)
  const adjustWeight = (delta: number) => {
    haptics.light();
    const current = parseFloat(weightInput.replace(',', '.')) || 0;
    const next = Math.max(0, current + delta);
    setWeightInput(next.toString());
  };

  const adjustReps = (delta: number) => {
    haptics.light();
    const current = parseInt(repsInput, 10) || 0;
    const next = Math.max(0, current + delta);
    setRepsInput(next.toString());
  };

  const handleLogWorkingSet = () => {
    const weight = parseFloat(weightInput.replace(',', '.')) || 0;
    const reps = parseInt(repsInput, 10) || 0;
    const isPr =
      currentExercise && weight > 0 && reps > 0
        ? workoutRepository.checkIsNewPR(currentExercise.id, weight, reps)
        : { isNewPR: false, prType: null, previousBest: 0 };

    const success = logCurrentSet();
    if (success) {
      if (isPr.isNewPR && currentExercise) {
        haptics.heavy();
        setPrAlert({
          exerciseName: currentExercise.name,
          weightKg: weight,
          reps: reps,
        });
      } else {
        haptics.success();
      }
      const restSecs = currentRoutineExercise?.restSeconds || 120;
      setRestTimer(restSecs);
      startTimer(restSecs, currentExercise?.name);
    } else {
      Alert.alert('Atenção', 'Informe um peso e quantidade de repetições válidos.');
    }
  };

  const handleLogFeederSet = (suggestion: PreparedSetSuggestion) => {
    if (!currentExercise || !activeWorkout) return;
    haptics.medium();
    setWeightInput(suggestion.weightKg.toString());
    setRepsInput(suggestion.reps.toString());
    logCurrentSet();
    setRestTimer(60);
    startTimer(60, `${currentExercise.name} (Feeder)`);
  };

  const handleDeleteLoggedSet = (setId: string) => {
    haptics.light();
    deleteSet(setId);
  };

  const handleFinish = () => {
    if (!activeWorkout || activeWorkout.sets.length === 0) {
      Alert.alert('Atenção', 'Registre ao menos uma série antes de finalizar o treino.');
      return;
    }
    haptics.medium();
    const duration = Math.max(1, Math.round((Date.now() - activeWorkout.startedAt) / 60000));
    setFinishedDurationMinutes(duration);
    setShowFinishModal(true);
  };

  const handleConfirmFinish = () => {
    haptics.heavy();
    finishCurrentWorkout();
    setShowFinishModal(false);
    setRestTimer(null);
    stopTimer();
    setPrAlert(null);
    loadData();
  };

  const handleCancel = () => {
    Alert.alert('Cancelar Treino', 'Deseja descartar este treino em andamento?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          cancelCurrentWorkout();
          setRestTimer(null);
          stopTimer();
          setPrAlert(null);
          loadData();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + Spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={true}
          alwaysBounceVertical={true}>
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

          {/* Banner de Recorde Pessoal Batido (PR) */}
          {prAlert && (
            <View
              style={[
                styles.prBanner,
                { backgroundColor: '#854D0E', borderColor: '#FACC15' },
              ]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" style={{ color: '#FEF08A', fontWeight: '800' }}>
                  🏆 NOVO RECORDE PESSOAL (PR)!
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', marginTop: 2 }}>
                  {prAlert.exerciseName}: {prAlert.weightKg} kg × {prAlert.reps} reps
                </ThemedText>
              </View>
              <Pressable onPress={() => setPrAlert(null)} hitSlop={10}>
                <ThemedText type="smallBold" style={{ color: '#FEF08A' }}>✕</ThemedText>
              </Pressable>
            </View>
          )}

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
              <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setRestTimer((prev) => Math.max(0, (prev !== null ? prev - 15 : 0)));
                  }}
                  style={[styles.skipTimerBtn, { backgroundColor: theme.cardElevated }]}>
                  <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                    -15s
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setRestTimer((prev) => (prev !== null ? prev + 30 : 30));
                  }}
                  style={[styles.skipTimerBtn, { backgroundColor: theme.cardElevated }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primaryHover }}>
                    +30s
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setRestTimer(null);
                  }}
                  style={[styles.skipTimerBtn, { backgroundColor: theme.cardElevated }]}>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    Pular ➔
                  </ThemedText>
                </Pressable>
              </View>
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
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.exerciseNavScroll}>
                  {activeExerciseList.map((re, idx) => {
                    const isSelected = currentExerciseIndex === idx;
                    const setsDoneForThisEx = activeWorkout.sets.filter(
                      (s) => s.exerciseId === re.exerciseId
                    ).length;
                    const isCompleted = setsDoneForThisEx >= re.workingSets;

                    return (
                      <Pressable
                        key={re.id}
                        onPress={() => handleSelectExerciseByOrder(idx)}
                        style={[
                          styles.exerciseNavChip,
                          {
                            backgroundColor: isSelected ? theme.cardElevated : theme.card,
                            borderColor: isSelected
                              ? theme.primary
                              : isCompleted
                              ? '#22c55e'
                              : theme.cardBorder,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, overflow: 'hidden' }}>
                          <ThemedText
                            type="smallBold"
                            numberOfLines={1}
                            style={{ color: isSelected ? theme.primary : theme.text, flex: 1 }}>
                            #{idx + 1} {re.exercise?.name}
                          </ThemedText>
                          {isCompleted && (
                            <ThemedText type="caption" style={{ color: '#22c55e', fontWeight: '700', flexShrink: 0 }}>
                              ✓
                            </ThemedText>
                          )}
                        </View>
                        <ThemedText
                          type="caption"
                          numberOfLines={1}
                          style={{ color: isCompleted ? '#22c55e' : theme.textMuted }}>
                          {setsDoneForThisEx}/{re.workingSets} válidas ({re.workingWeightKg}kg)
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Se nenhum exercício foi selecionado ainda (ex: início de treino livre) */}
              {!currentExercise && (
                <View style={[styles.emptyRoutineCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="title">Nenhum exercício selecionado</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                    Selecione um exercício do catálogo para registrar suas séries válidas.
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      haptics.medium();
                      setShowExerciseSelector(true);
                    }}
                    style={[styles.bigLogBtn, { backgroundColor: theme.primary, marginTop: Spacing.md }]}>
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                      + Escolher Exercício do Catálogo
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Detalhes do Exercício Atual + Séries Preparatórias Calculadas */}
              {currentExercise && (
                <View style={styles.exerciseExecutionSection}>
                  <View
                    style={[
                      styles.exerciseTitleBox,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <View style={styles.exerciseHeaderTagRow}>
                      <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                        {activeExerciseList.length > 0
                          ? `EXERCÍCIO ${currentExerciseIndex + 1} DE ${activeExerciseList.length}`
                          : 'EXERCÍCIO SELECIONADO'}
                      </ThemedText>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setShowExerciseSelector(true);
                        }}
                        hitSlop={8}
                        style={[styles.switchExBtn, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                        <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                          🔄 Trocar / Adicionar
                        </ThemedText>
                      </Pressable>
                    </View>
                    <ThemedText type="header" style={{ marginTop: 2 }}>{currentExercise.name}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                      {currentExercise.muscleGroup} • {currentExercise.movementPattern}
                      {currentRoutineExercise ? ` • Alvo: ${currentRoutineExercise.workingSets} séries × ${currentRoutineExercise.repsMin}–${currentRoutineExercise.repsMax} reps @ ${currentRoutineExercise.workingWeightKg} kg` : ''}
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        REGISTRAR SÉRIE VÁLIDA
                      </ThemedText>
                      {currentExercisePR && (
                        <View style={styles.prBadge}>
                          <ThemedText type="caption" style={{ color: '#F59E0B', fontWeight: '700' }}>
                            🏆 PR: {currentExercisePR.maxWeight}kg • 1RM: ~{currentExercisePR.max1RM}kg
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Ghost Sets: Séries da Última Sessão Realizada */}
                    {currentExerciseLastSessionSets.length > 0 && (
                      <View style={[styles.ghostSessionBox, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                        <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700', marginBottom: 4 }}>
                          ÚLTIMO TREINO (META PARA SUPERAR):
                        </ThemedText>
                        <View style={styles.ghostSetsRow}>
                          {currentExerciseLastSessionSets.map((gs, idx) => (
                            <Pressable
                              key={gs.id || idx}
                              onPress={() => {
                                haptics.light();
                                setWeightInput(gs.weightKg.toString());
                                setRepsInput(gs.reps.toString());
                              }}
                              style={[styles.ghostSetChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                              <ThemedText type="caption" style={{ color: theme.textMuted }}>
                                S{idx + 1}:
                              </ThemedText>
                              <ThemedText type="smallBold" style={{ color: theme.text, marginLeft: 2 }}>
                                {gs.weightKg}kg × {gs.reps}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={styles.inputRow}>
                      <View style={styles.inputCol}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <ThemedText type="caption">Carga Real (kg)</ThemedText>
                          <Pressable
                            onPress={() => {
                              haptics.light();
                              setShowPlateCalcModal(true);
                            }}
                            hitSlop={4}
                            style={styles.plateCalcTriggerBtn}>
                            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                              ⚖️ Anilhas
                            </ThemedText>
                          </Pressable>
                        </View>
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
                        {/* Botões de ajuste rápido de carga */}
                        <View style={styles.quickAdjustRow}>
                          <Pressable onPress={() => adjustWeight(-5)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>-5</ThemedText>
                          </Pressable>
                          <Pressable onPress={() => adjustWeight(-2)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>-2</ThemedText>
                          </Pressable>
                          <Pressable onPress={() => adjustWeight(2)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>+2</ThemedText>
                          </Pressable>
                          <Pressable onPress={() => adjustWeight(5)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>+5</ThemedText>
                          </Pressable>
                        </View>
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
                        {/* Botões de ajuste rápido de reps */}
                        <View style={styles.quickAdjustRow}>
                          <Pressable onPress={() => adjustReps(-1)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>-1</ThemedText>
                          </Pressable>
                          <Pressable onPress={() => adjustReps(1)} style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>+1</ThemedText>
                          </Pressable>
                        </View>
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

                  {/* Histórico das Séries Registradas Nesta Sessão + Botão Desfazer */}
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText type="subtitle">Séries Feitas Neste Treino ({activeWorkout.sets.length})</ThemedText>
                    {activeWorkout.sets.length > 0 && (
                      <Pressable
                        onPress={() => {
                          haptics.medium();
                          undoLastSet();
                        }}
                        hitSlop={8}
                        style={[styles.undoSetBtn, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                        <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                          ↩ Desfazer Série
                        </ThemedText>
                      </Pressable>
                    )}
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
                          <ThemedText type="smallBold" style={{ color: theme.primary, flexShrink: 0 }}>
                            #{idx + 1}
                          </ThemedText>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold" numberOfLines={1}>{s.exercise?.name}</ThemedText>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                              {s.weightKg} kg × {s.reps} reps {s.reps > 0 && `(1RM ~${calculateOneRepMax(s.weightKg, s.reps)}kg)`}
                            </ThemedText>
                          </View>
                        </View>
                        <Pressable onPress={() => handleDeleteLoggedSet(s.id)} hitSlop={8} style={{ flexShrink: 0 }}>
                          <ThemedText type="caption" style={{ color: theme.danger }}>
                            Excluir
                          </ThemedText>
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Anotações da Sessão */}
                  <View style={[styles.notesCardBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                      📝 ANOTAÇÕES DA SESSÃO
                    </ThemedText>
                    <TextInput
                      value={sessionNotes}
                      onChangeText={setSessionNotes}
                      placeholder="Observações do treino, sensações, dores ou metas..."
                      placeholderTextColor={theme.textMuted}
                      multiline
                      style={[
                        styles.sessionNotesTextInput,
                        {
                          backgroundColor: theme.backgroundElevated,
                          borderColor: theme.cardBorder,
                          color: theme.text,
                        },
                      ]}
                    />
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
                    <ThemedText type="subtitle">Sessão de Hoje</ThemedText>
                  </View>

                  {/* Sessão Sugerida */}
                  {activeRoutine.workouts[suggestedWorkoutIndex] && (
                    <Pressable
                      onPress={() => setPreviewWorkout(activeRoutine.workouts[suggestedWorkoutIndex])}
                      style={[
                        styles.suggestedCard,
                        { backgroundColor: theme.primaryDark, borderColor: theme.primary },
                      ]}>
                      <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                        <View style={styles.suggestedBadge}>
                          <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                            SUGERIDA PARA HOJE
                          </ThemedText>
                        </View>
                        {completedTodayIds.has(activeRoutine.workouts[suggestedWorkoutIndex].id) && (
                          <View style={styles.doneTodayBadge}>
                            <ThemedText type="caption" style={{ color: '#22c55e', fontWeight: '700' }}>
                              ✓ CONCLUÍDO HOJE
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <View style={styles.workoutPickTop}>
                        <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                          {activeRoutine.workouts[suggestedWorkoutIndex].name}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.primaryHover }}>
                          {activeRoutine.workouts[suggestedWorkoutIndex].exercises.length} exercícios
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.primaryHover, opacity: 0.8 }}>
                        {activeRoutine.workouts[suggestedWorkoutIndex].exercises
                          .map((e) => e.exercise?.name)
                          .slice(0, 3)
                          .join(', ')}
                        {activeRoutine.workouts[suggestedWorkoutIndex].exercises.length > 3 ? '...' : ''}
                      </ThemedText>
                      <View style={[styles.startChip, { backgroundColor: theme.primary, borderColor: theme.primaryHover }]}>
                        <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                          Ver Treino & Iniciar →
                        </ThemedText>
                      </View>
                    </Pressable>
                  )}

                  {/* Outras Sessões */}
                  {activeRoutine.workouts.length > 1 && (
                    <>
                      <ThemedText type="caption" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                        OUTRAS SESSÕES
                      </ThemedText>
                      <View style={styles.workoutsGrid}>
                        {activeRoutine.workouts
                          .filter((_, idx) => idx !== suggestedWorkoutIndex)
                          .map((rw) => (
                          <Pressable
                            key={rw.id}
                            onPress={() => setPreviewWorkout(rw)}
                            style={[
                              styles.workoutPickCard,
                              { backgroundColor: theme.card, borderColor: theme.cardBorder },
                            ]}>
                            <View style={styles.workoutPickTop}>
                              <ThemedText type="smallBold">{rw.name}</ThemedText>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                                {completedTodayIds.has(rw.id) && (
                                  <View style={styles.doneTodayMiniBadge}>
                                    <ThemedText type="caption" style={{ color: '#22c55e', fontSize: 10, fontWeight: '700' }}>
                                      ✓ Feito
                                    </ThemedText>
                                  </View>
                                )}
                                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                  {rw.exercises.length} ex.
                                </ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
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

              {/* Treino Livre (Sem Divisão) */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Treino Livre</ThemedText>
              </View>

              <Pressable
                onPress={() => {
                  haptics.medium();
                  startNewWorkout('Treino Livre');
                  setShowExerciseSelector(true);
                }}
                style={[
                  styles.freeWorkoutCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">⚡ Iniciar Treino Livre</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    Treine livremente sem rotina fixa. Escolha qualquer exercício do catálogo.
                  </ThemedText>
                </View>
                <View style={[styles.startChip, { backgroundColor: theme.primary, borderColor: theme.primaryHover }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Iniciar ➔
                  </ThemedText>
                </View>
              </Pressable>

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
                    <Pressable
                      key={w.id}
                      onPress={() => {
                        haptics.light();
                        setSelectedHistoryWorkoutId(w.id);
                      }}
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
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {w.sets.length} séries registradas
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                          Ver Detalhes →
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modal: Prévia da Sessão de Treino antes de Iniciar */}
      <Modal
        visible={previewWorkout !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewWorkout(null)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder },
            ]}>
            {previewWorkout && (
              <>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.primary }}>
                      PRÉVIA DA SESSÃO
                    </ThemedText>
                    <ThemedText type="title">{previewWorkout.name}</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setPreviewWorkout(null)}
                    hitSlop={12}
                    style={styles.modalCloseBtn}>
                    <ThemedText type="title" style={{ color: theme.textSecondary }}>
                      ✕
                    </ThemedText>
                  </Pressable>
                </View>

                {completedTodayIds.has(previewWorkout.id) && (
                  <View
                    style={[
                      styles.completedTodayBanner,
                      { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: '#22c55e' },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: '#22c55e' }}>
                      ✓ Sessão já concluída hoje
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Você já realizou este treino hoje. Você ainda pode executá-lo novamente se desejar.
                    </ThemedText>
                  </View>
                )}

                <ThemedText type="caption" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                  EXERCÍCIOS PROGRAMADOS ({previewWorkout.exercises.length})
                </ThemedText>

                <ScrollView
                  style={styles.previewExerciseList}
                  showsVerticalScrollIndicator={false}>
                  {previewWorkout.exercises.map((re, idx) => {
                    const lastPerf = re.exercise
                      ? workoutRepository.getLastExercisePerformance(re.exercise.id)
                      : null;

                    return (
                      <View
                        key={re.id}
                        style={[
                          styles.previewExerciseItem,
                          { backgroundColor: theme.card, borderColor: theme.cardBorder },
                        ]}>
                        <View style={styles.previewExerciseTop}>
                          <View style={styles.previewExerciseIndexBadge}>
                            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                              #{idx + 1}
                            </ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{re.exercise?.name}</ThemedText>
                            <ThemedText
                              type="caption"
                              style={{ color: theme.textSecondary, textTransform: 'capitalize' }}>
                              {re.exercise?.muscleGroup} • {re.exercise?.movementPattern}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.previewExerciseDetails}>
                          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            Meta: {re.workingSets} séries × {re.repsMin}-{re.repsMax} reps
                            {re.workingWeightKg > 0 ? ` • ${re.workingWeightKg} kg` : ''}
                            {` • ${re.restSeconds}s descanso`}
                          </ThemedText>
                          {lastPerf && (
                            <ThemedText type="caption" style={{ color: theme.primaryHover }}>
                              Último treino: {lastPerf.weightKg} kg × {lastPerf.reps} reps
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.previewActions}>
                  <Pressable
                    onPress={() => handleStartRoutineWorkout(previewWorkout)}
                    style={[styles.startWorkoutModalBtn, { backgroundColor: theme.primary }]}>
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                      INICIAR TREINO AGORA ➔
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setPreviewWorkout(null)}
                    style={[styles.closePreviewBtn, { borderColor: theme.cardBorder }]}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Voltar
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Resumo ao Finalizar Treino */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFinishModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder },
            ]}>
            {activeWorkout && (
              <>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                      TREINO CONCLUÍDO
                    </ThemedText>
                    <ThemedText type="title">{activeWorkout.name}</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setShowFinishModal(false)}
                    hitSlop={12}
                    style={styles.modalCloseBtn}>
                    <ThemedText type="title" style={{ color: theme.textSecondary }}>
                      ✕
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Métricas Principais */}
                <View style={styles.finishMetricsGrid}>
                  <View
                    style={[
                      styles.metricBox,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      DURAÇÃO
                    </ThemedText>
                    <ThemedText type="title" style={{ color: theme.primary }}>
                      {finishedDurationMinutes} min
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.metricBox,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      SÉRIES
                    </ThemedText>
                    <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                      {activeWorkout.sets.length}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.metricBox,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      TONELAGEM
                    </ThemedText>
                    <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                      {Math.round(activeWorkout.sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0))} kg
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="caption" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                  SÉRIES REGISTRADAS NESTA SESSÃO
                </ThemedText>

                <ScrollView
                  style={styles.previewExerciseList}
                  showsVerticalScrollIndicator={false}>
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
                    </View>
                  ))}
                </ScrollView>

                {/* Anotações no Resumo do Treino */}
                <View style={[styles.finishNotesBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                    📝 ANOTAÇÕES DO TREINO (OPCIONAL)
                  </ThemedText>
                  <TextInput
                    value={sessionNotes}
                    onChangeText={setSessionNotes}
                    placeholder="Como foi o treino hoje? RPE, dores, metas batidas..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    style={[
                      styles.finishNotesInput,
                      {
                        backgroundColor: theme.backgroundElevated,
                        borderColor: theme.cardBorder,
                        color: theme.text,
                      },
                    ]}
                  />
                </View>

                <View style={styles.previewActions}>
                  <Pressable
                    onPress={handleConfirmFinish}
                    style={[styles.startWorkoutModalBtn, { backgroundColor: theme.primary }]}>
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                      CONCLUIR E SALVAR ➔
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowFinishModal(false)}
                    style={[styles.closePreviewBtn, { borderColor: theme.cardBorder }]}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Continuar Treino
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

        {/* Modal: Calculadora de Anilhas */}
        <PlateCalculatorModal
          visible={showPlateCalcModal}
          initialWeight={parseFloat(weightInput.replace(',', '.')) || currentRoutineExercise?.workingWeightKg || 80}
          exerciseName={currentExercise?.name || 'Exercício'}
          onClose={() => setShowPlateCalcModal(false)}
          onApplyWeight={(weight) => {
            setWeightInput(weight.toString());
          }}
        />

        {/* Modal: Seletor de Exercícios */}
        <ExerciseSelectorModal
          visible={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelectExercise={(ex) => {
            selectExercise(ex);
            setShowExerciseSelector(false);
          }}
        />

        {/* Modal: Detalhes do Treino Histórico */}
        <WorkoutDetailModal
          workoutId={selectedHistoryWorkoutId}
          visible={selectedHistoryWorkoutId !== null}
          onClose={() => setSelectedHistoryWorkoutId(null)}
          onDeleted={loadData}
        />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl, // overridden inline with tabBarHeight
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
    flex: 1,
    marginRight: Spacing.sm,
    overflow: 'hidden',
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
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  suggestedCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  suggestedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(220,38,38,0.25)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  completedTodayBanner: {
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    gap: 2,
  },
  previewExerciseList: {
    maxHeight: 280,
  },
  previewExerciseItem: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  previewExerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewExerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewExerciseDetails: {
    paddingLeft: 32,
    gap: 2,
  },
  previewActions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  startWorkoutModalBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePreviewBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTodayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  doneTodayMiniBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  exerciseHeaderTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatPerfBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  quickAdjustRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    justifyContent: 'center',
  },
  adjustBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  finishMetricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  metricBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  prBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ghostSessionBox: {
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  ghostSetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  ghostSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  plateCalcTriggerBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    marginVertical: Spacing.xs,
  },
  switchExBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  undoSetBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  notesCardBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sessionNotesTextInput: {
    minHeight: 64,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  freeWorkoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  finishNotesBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  finishNotesInput: {
    minHeight: 56,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    fontSize: 13,
    textAlignVertical: 'top',
  },
});
