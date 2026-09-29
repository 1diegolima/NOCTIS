import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

import { ExerciseSelectorModal } from '@/components/exercise-selector-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { Exercise, SplitType } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import {
  FullRoutine,
  RoutineWorkoutWithExercises,
  routineRepository,
} from '@/features/routines/routine-repository';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

export default function RoutinesScreen() {
  const theme = useTheme();
  const tabBarHeight = useTabBarHeight();

  const [activeRoutine, setActiveRoutine] = useState<FullRoutine | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<RoutineWorkoutWithExercises | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearchMuscle, setExerciseSearchMuscle] = useState<string>('Todos');
  const [exerciseSearchText, setExerciseSearchText] = useState<string>('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Form para adicionar exercício
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState<Exercise | null>(null);
  const [workingSetsInput, setWorkingSetsInput] = useState('2');
  const [repsMinInput, setRepsMinInput] = useState('6');
  const [repsMaxInput, setRepsMaxInput] = useState('10');
  const [weightInput, setWeightInput] = useState('80');

  const loadRoutineData = useCallback(() => {
    try {
      const routine = routineRepository.getActiveRoutine();
      setActiveRoutine(routine);
      if (routine && routine.workouts.length > 0) {
        setSelectedWorkout((prev) => {
          if (!prev) return routine.workouts[0];
          const found = routine.workouts.find((w) => w.id === prev.id);
          return found || routine.workouts[0];
        });
      }
      setAllExercises(exerciseRepository.getAll());
    } catch (e) {
      console.error('Erro ao carregar dados de rotina:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutineData();
    }, [loadRoutineData])
  );

  const handleSelectSplit = (splitType: SplitType, name: string) => {
    haptics.medium();
    const created = routineRepository.createRoutine(name, splitType);
    setActiveRoutine(created);
    if (created.workouts.length > 0) {
      setSelectedWorkout(created.workouts[0]);
    }
    setShowSplitModal(false);
  };

  const handleAddExerciseToWorkout = () => {
    Keyboard.dismiss();
    if (!selectedWorkout || !selectedExerciseToAdd) {
      Alert.alert('Atenção', 'Selecione um exercício primeiro.');
      return;
    }

    const sets = parseInt(workingSetsInput, 10) || 2;
    const rMin = parseInt(repsMinInput, 10) || 6;
    const rMax = parseInt(repsMaxInput, 10) || 10;
    const weight = parseFloat(weightInput.replace(',', '.')) || 0;

    haptics.success();
    routineRepository.addExerciseToWorkout({
      routineWorkoutId: selectedWorkout.id,
      exerciseId: selectedExerciseToAdd.id,
      workingSets: sets,
      repsMin: rMin,
      repsMax: rMax,
      workingWeightKg: weight,
    });

    loadRoutineData();
    setShowAddExerciseModal(false);
    setSelectedExerciseToAdd(null);
  };

  const handleRemoveExercise = (routineExerciseId: string) => {
    Alert.alert('Remover Exercício', 'Deseja remover este exercício da sua rotina?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          routineRepository.removeExerciseFromWorkout(routineExerciseId);
          loadRoutineData();
        },
      },
    ]);
  };

  const muscles = [
    'Todos',
    'Peito',
    'Costas',
    'Ombros',
    'Bíceps',
    'Tríceps',
    'Quadríceps',
    'Posteriores',
    'Glúteos',
    'Panturrilhas',
    'Abdômen',
  ];

  const filteredExercises = allExercises.filter((e) => {
    const matchMuscle =
      exerciseSearchMuscle === 'Todos' ||
      e.muscleGroup.toLowerCase() === exerciseSearchMuscle.toLowerCase();
    const matchText =
      !exerciseSearchText.trim() ||
      e.name.toLowerCase().includes(exerciseSearchText.trim().toLowerCase());
    return matchMuscle && matchText;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: tabBarHeight + Spacing.xxxl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {/* Top Bar */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <ThemedText type="header">Montar Treino</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {activeRoutine ? activeRoutine.name : 'Nenhuma divisão configurada'}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setShowSplitModal(true);
                  }}
                  style={[
                    styles.splitButton,
                    { borderColor: theme.cardBorder, backgroundColor: theme.card },
                  ]}>
                  <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                    Mudar Divisão ⚙
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Abas das Sessões da Divisão (Ex: Push, Pull, Legs, Upper, Lower) */}
            {activeRoutine && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.workoutTabsScroll}>
                {activeRoutine.workouts.map((w) => {
                  const isSelected = selectedWorkout?.id === w.id;
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => {
                        haptics.light();
                        setSelectedWorkout(w);
                      }}
                      style={[
                        styles.workoutTabChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.card,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                        },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: isSelected ? '#FFFFFF' : theme.text }}>
                        {w.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Conteúdo da Sessão Selecionada */}
            {selectedWorkout && (
              <View style={styles.workoutConfigContainer}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText type="subtitle">
                    Exercícios ({selectedWorkout.exercises.length})
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      haptics.medium();
                      setShowAddExerciseModal(true);
                    }}
                    style={[styles.addExerciseBtn, { backgroundColor: theme.primary }]}>
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                      + Adicionar Exercício
                    </ThemedText>
                  </Pressable>
                </View>

                {selectedWorkout.exercises.length === 0 ? (
                  <View
                    style={[
                      styles.emptyCard,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    ]}>
                    <ThemedText type="title" style={{ textAlign: 'center' }}>
                      Nenhum exercício adicionado
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textMuted, textAlign: 'center', marginTop: 4 }}>
                      Toque no botão acima para adicionar exercícios a esta sessão.
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.exercisesList}>
                    {selectedWorkout.exercises.map((re, index) => (
                      <View
                        key={re.id}
                        style={[
                          styles.exerciseCard,
                          { backgroundColor: theme.card, borderColor: theme.cardBorder },
                        ]}>
                        {/* Header do Exercício com Nome e Botão Remover Alinhados */}
                        <View style={styles.exerciseCardTop}>
                          <View style={styles.exerciseCardLeft}>
                            <View
                              style={[
                                styles.indexBadge,
                                { backgroundColor: theme.backgroundElevated },
                              ]}>
                              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                                #{index + 1}
                              </ThemedText>
                            </View>
                            <View style={styles.exerciseTitleContainer}>
                              <ThemedText
                                type="title"
                                numberOfLines={1}
                                style={styles.exerciseNameText}>
                                {re.exercise?.name ?? 'Exercício'}
                              </ThemedText>
                              <ThemedText type="caption" style={{ color: theme.textMuted }}>
                                {re.exercise?.muscleGroup} • {re.exercise?.category}
                              </ThemedText>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => handleRemoveExercise(re.id)}
                            style={styles.deleteExerciseBtn}
                            hitSlop={6}>
                            <ThemedText type="caption" style={{ color: theme.danger, fontWeight: '700' }}>
                              Remover
                            </ThemedText>
                          </Pressable>
                        </View>

                        {/* Configurações da Carga e Séries Válidas */}
                        <View
                          style={[
                            styles.configGrid,
                            {
                              backgroundColor: theme.backgroundElevated,
                              borderColor: theme.cardBorder,
                            },
                          ]}>
                          <View style={styles.configItem}>
                            <ThemedText type="caption">Séries Válidas</ThemedText>
                            <ThemedText type="smallBold">{re.workingSets} séries</ThemedText>
                          </View>

                          <View style={styles.configItem}>
                            <ThemedText type="caption">Faixa Alvo</ThemedText>
                            <ThemedText type="smallBold">
                              {re.repsMin}–{re.repsMax} reps
                            </ThemedText>
                          </View>

                          <View style={styles.configItem}>
                            <ThemedText type="caption">Carga Alvo</ThemedText>
                            <ThemedText type="smallBold" style={{ color: theme.primary }}>
                              {re.workingWeightKg} kg
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>

        {/* MODAL 1: MUDAR DIVISÃO DE TREINO */}
        <Modal
          visible={showSplitModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSplitModal(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder },
              ]}>
              <View style={styles.modalHeaderRow}>
                <ThemedText type="title">Escolha sua Divisão</ThemedText>
                <Pressable onPress={() => setShowSplitModal(false)} hitSlop={12}>
                  <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Selecione um modelo de hipertrofia predefinido:
              </ThemedText>

              <View style={styles.splitOptionsList}>
                <Pressable
                  style={[
                    styles.splitOptionCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                  onPress={() =>
                    handleSelectSplit('ppl_ul', 'Divisão PPL/UL (5 Dias - Push, Pull, Legs, Upper, Lower)')
                  }>
                  <ThemedText type="smallBold">PPL + Upper / Lower (5 Dias) 🔥</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textMuted }}>
                    Push, Pull, Legs, Upper, Lower (Recomendado para Máxima Hipertrofia)
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.splitOptionCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                  onPress={() => handleSelectSplit('ppl', 'Divisão PPL Clássica (3 Dias)')}>
                  <ThemedText type="smallBold">PPL Clássico (3 a 6 Dias)</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textMuted }}>
                    Push (Empurrar), Pull (Puxar), Legs (Pernas)
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.splitOptionCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                  onPress={() => handleSelectSplit('upper_lower', 'Divisão Upper / Lower (4 Dias)')}>
                  <ThemedText type="smallBold">Upper / Lower (4 Dias)</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textMuted }}>
                    Superior A, Inferior A, Superior B, Inferior B
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* OVERLAY: SELETOR AVANÇADO DE EXERCÍCIOS */}
        <ExerciseSelectorModal
          visible={showAddExerciseModal}
          onClose={() => setShowAddExerciseModal(false)}
          onSelectExercise={(ex) => {
            setSelectedExerciseToAdd(ex);
          }}
          excludeExerciseIds={selectedWorkout?.exercises.map((e) => e.exerciseId) || []}
          title={`Adicionar ao ${selectedWorkout?.name || 'Treino'}`}
        />

        {/* OVERLAY: CONFIGURAR PARÂMETROS DO EXERCÍCIO ADICIONADO */}
        {selectedExerciseToAdd && (
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%' }}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.cardElevated, borderColor: theme.primary },
                ]}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                      PARÂMETROS DE TRABALHO
                    </ThemedText>
                    <ThemedText type="title">{selectedExerciseToAdd.name}</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setSelectedExerciseToAdd(null)}
                    hitSlop={12}>
                    <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Séries</ThemedText>
                    <TextInput
                      value={workingSetsInput}
                      onChangeText={setWorkingSetsInput}
                      keyboardType="number-pad"
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: theme.backgroundElevated,
                          borderColor: theme.cardBorder,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Reps Mín</ThemedText>
                    <TextInput
                      value={repsMinInput}
                      onChangeText={setRepsMinInput}
                      keyboardType="number-pad"
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: theme.backgroundElevated,
                          borderColor: theme.cardBorder,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Reps Máx</ThemedText>
                    <TextInput
                      value={repsMaxInput}
                      onChangeText={setRepsMaxInput}
                      keyboardType="number-pad"
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: theme.backgroundElevated,
                          borderColor: theme.cardBorder,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Carga (kg)</ThemedText>
                    <TextInput
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="numeric"
                      style={[
                        styles.formInput,
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
                  onPress={handleAddExerciseToWorkout}
                  style={[styles.confirmAddBtn, { backgroundColor: theme.primary, marginTop: Spacing.sm }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Confirmar Exercício na Rotina
                  </ThemedText>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
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
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  workoutTabsScroll: {
    gap: Spacing.sm,
  },
  workoutTabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  workoutConfigContainer: {
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addExerciseBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  exercisesList: {
    gap: Spacing.sm,
  },
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  exerciseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseNameText: {
    flexShrink: 1,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteExerciseBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  configGrid: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  configItem: {
    alignItems: 'center',
    gap: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modalContentBig: {
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    maxHeight: '90%',
  },
  splitOptionsList: {
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  splitOptionCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    gap: 2,
  },
  modalMuscleScroll: {
    maxHeight: 38,
    marginVertical: Spacing.xs,
  },
  muscleChipSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  exerciseSearchInput: {
    height: 40,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  exercisePickList: {
    maxHeight: 220,
  },
  exercisePickItem: {
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  formConfigBox: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  formGroup: {
    flex: 1,
    gap: 2,
  },
  formInput: {
    height: 38,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  confirmAddBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
});
