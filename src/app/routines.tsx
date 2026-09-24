import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { Exercise, SplitType } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import {
  FullRoutine,
  RoutineWorkoutWithExercises,
  routineRepository,
} from '@/features/routines/routine-repository';
import { useTheme } from '@/hooks/use-theme';

export default function RoutinesScreen() {
  const theme = useTheme();

  const [activeRoutine, setActiveRoutine] = useState<FullRoutine | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<RoutineWorkoutWithExercises | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearchMuscle, setExerciseSearchMuscle] = useState<string>('Todos');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Form para adicionar exercício
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState<Exercise | null>(null);
  const [workingSetsInput, setWorkingSetsInput] = useState('2');
  const [repsMinInput, setRepsMinInput] = useState('6');
  const [repsMaxInput, setRepsMaxInput] = useState('10');
  const [weightInput, setWeightInput] = useState('80');

  const loadRoutineData = useCallback(() => {
    const routine = routineRepository.getActiveRoutine();
    setActiveRoutine(routine);
    if (routine && routine.workouts.length > 0) {
      setSelectedWorkout(routine.workouts[0]);
    }
    setAllExercises(exerciseRepository.getAll());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutineData();
    }, [loadRoutineData])
  );

  const handleSelectSplit = (splitType: SplitType, name: string) => {
    const created = routineRepository.createRoutine(name, splitType);
    setActiveRoutine(created);
    if (created.workouts.length > 0) {
      setSelectedWorkout(created.workouts[0]);
    }
    setShowSplitModal(false);
  };

  const handleAddExerciseToWorkout = () => {
    if (!selectedWorkout || !selectedExerciseToAdd) {
      Alert.alert('Atenção', 'Selecione um exercício primeiro.');
      return;
    }

    const sets = parseInt(workingSetsInput, 10) || 2;
    const rMin = parseInt(repsMinInput, 10) || 6;
    const rMax = parseInt(repsMaxInput, 10) || 10;
    const weight = parseFloat(weightInput.replace(',', '.')) || 0;

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
          routineRepository.removeExerciseFromWorkout(routineExerciseId);
          loadRoutineData();
        },
      },
    ]);
  };

  const muscles = ['Todos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilhas', 'Abdômen'];

  const filteredExercises = allExercises.filter((e) =>
    exerciseSearchMuscle === 'Todos' ? true : e.muscleGroup === exerciseSearchMuscle
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <ThemedText type="header">Montar Treino</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {activeRoutine ? activeRoutine.name : 'Nenhuma divisão configurada'}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setShowSplitModal(true)}
                style={[styles.splitButton, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
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
                    onPress={() => setSelectedWorkout(w)}
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
                  onPress={() => setShowAddExerciseModal(true)}
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
                  <ThemedText type="default" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhum exercício adicionado a esta sessão.
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textMuted, textAlign: 'center', marginTop: 4 }}>
                    Toque no botão acima para montar seu treino.
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
                          <View>
                            <ThemedText type="title">
                              {re.exercise?.name ?? 'Exercício'}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: theme.textMuted }}>
                              {re.exercise?.muscleGroup} • {re.exercise?.category}
                            </ThemedText>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveExercise(re.id)}
                          hitSlop={8}>
                          <ThemedText type="small" style={{ color: theme.danger }}>
                            Remover
                          </ThemedText>
                        </Pressable>
                      </View>

                      {/* Configurações da Carga e Séries Válidas */}
                      <View
                        style={[
                          styles.configGrid,
                          { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder },
                        ]}>
                        <View style={styles.configItem}>
                          <ThemedText type="caption">Séries Válidas</ThemedText>
                          <ThemedText type="smallBold">{re.workingSets} séries</ThemedText>
                        </View>

                        <View style={styles.configItem}>
                          <ThemedText type="caption">Faixa Alvo</ThemedText>
                          <ThemedText type="smallBold">{re.repsMin}–{re.repsMax} reps</ThemedText>
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

      {/* Modal: Escolher Divisão de Treino */}
      <Modal visible={showSplitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
            <ThemedText type="title">Escolha sua Divisão</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
              O NOCTIS organizará os treinos automaticamente com base no modelo escolhido:
            </ThemedText>

            <View style={styles.splitOptionsList}>
              <Pressable
                onPress={() => handleSelectSplit('ppl_ul', 'Divisão PPL/UL (5 Dias)')}
                style={[styles.splitOptionCard, { borderColor: theme.cardBorder }]}>
                <ThemedText type="smallBold">Push / Pull / Legs / Upper / Lower (5 Dias)</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Ideal para frequência alta e equilíbrio completo.
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleSelectSplit('ppl', 'Divisão PPL Clássica (3-6 Dias)')}
                style={[styles.splitOptionCard, { borderColor: theme.cardBorder }]}>
                <ThemedText type="smallBold">Push / Pull / Legs (3 Dias)</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Divisão clássica por padrão de movimento.
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleSelectSplit('upper_lower', 'Divisão Upper / Lower (4 Dias)')}
                style={[styles.splitOptionCard, { borderColor: theme.cardBorder }]}>
                <ThemedText type="smallBold">Upper / Lower (4 Dias)</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Divisão superior e inferior.
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleSelectSplit('full_body', 'Divisão Full Body (3 Dias)')}
                style={[styles.splitOptionCard, { borderColor: theme.cardBorder }]}>
                <ThemedText type="smallBold">Full Body (3 Dias)</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Corpo inteiro em cada sessão.
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowSplitModal(false)}
              style={[styles.modalCloseBtn, { backgroundColor: theme.backgroundElevated }]}>
              <ThemedText type="smallBold">Fechar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal: Adicionar Exercício ao Treino */}
      <Modal visible={showAddExerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentBig, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
            <ThemedText type="title">Biblioteca de Exercícios</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              Selecione o exercício e defina os parâmetros:
            </ThemedText>

            {/* Filtro Muscular */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalMuscleScroll}>
              {muscles.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setExerciseSearchMuscle(m)}
                  style={[
                    styles.muscleChipSmall,
                    {
                      backgroundColor: exerciseSearchMuscle === m ? theme.primary : theme.card,
                      borderColor: exerciseSearchMuscle === m ? theme.primary : theme.cardBorder,
                    },
                  ]}>
                  <ThemedText type="caption" style={{ color: exerciseSearchMuscle === m ? '#FFFFFF' : theme.textSecondary }}>
                    {m}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            {/* Lista de Exercícios */}
            <ScrollView style={styles.exercisePickList}>
              {filteredExercises.map((ex) => {
                const isSelected = selectedExerciseToAdd?.id === ex.id;
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => setSelectedExerciseToAdd(ex)}
                    style={[
                      styles.exercisePickItem,
                      {
                        backgroundColor: isSelected ? theme.primaryDark : theme.card,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: isSelected ? theme.primaryHover : theme.text }}>
                      {ex.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textMuted }}>
                      {ex.muscleGroup} • {ex.equipment} • {ex.category}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Configuração de Séries e Cargas Alvo */}
            {selectedExerciseToAdd && (
              <View style={[styles.formConfigBox, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary, marginBottom: Spacing.xs }}>
                  Configuração: {selectedExerciseToAdd.name}
                </ThemedText>

                <View style={styles.formRow}>
                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Séries Válidas</ThemedText>
                    <TextInput
                      value={workingSetsInput}
                      onChangeText={setWorkingSetsInput}
                      keyboardType="number-pad"
                      style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Reps Mín.</ThemedText>
                    <TextInput
                      value={repsMinInput}
                      onChangeText={setRepsMinInput}
                      keyboardType="number-pad"
                      style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Reps Máx.</ThemedText>
                    <TextInput
                      value={repsMaxInput}
                      onChangeText={setRepsMaxInput}
                      keyboardType="number-pad"
                      style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText type="caption">Carga (kg)</ThemedText>
                    <TextInput
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="numeric"
                      style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleAddExerciseToWorkout}
                  style={[styles.confirmAddBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Confirmar e Adicionar
                  </ThemedText>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => setShowAddExerciseModal(false)}
              style={[styles.modalCloseBtn, { backgroundColor: theme.backgroundElevated, marginTop: Spacing.sm }]}>
              <ThemedText type="smallBold">Cancelar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    gap: Spacing.md,
  },
  exerciseCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  exerciseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modalContentBig: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    maxHeight: '85%',
  },
  splitOptionsList: {
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  splitOptionCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 2,
  },
  modalCloseBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMuscleScroll: {
    maxHeight: 38,
    marginBottom: Spacing.sm,
  },
  muscleChipSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  exercisePickList: {
    maxHeight: 200,
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
