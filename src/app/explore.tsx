import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { workoutRepository, WorkoutWithSets } from '@/features/workouts/workout-repository';
import { useTheme } from '@/hooks/use-theme';
import { useActiveWorkoutStore } from '@/stores/active-workout-store';

export default function WorkoutsScreen() {
  const theme = useTheme();

  const {
    activeWorkout,
    exercisesList,
    selectedExercise,
    weightInput,
    repsInput,
    initialize,
    startNewWorkout,
    selectExercise,
    setWeightInput,
    setRepsInput,
    logCurrentSet,
    deleteSet,
    finishCurrentWorkout,
    cancelCurrentWorkout,
  } = useActiveWorkoutStore();

  const [history, setHistory] = useState<WorkoutWithSets[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');

  const loadHistory = useCallback(() => {
    initialize();
    const all = workoutRepository.getAll();
    const full = all.map((w) => workoutRepository.getById(w.id)).filter(Boolean) as WorkoutWithSets[];
    setHistory(full);
  }, [initialize]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const muscles = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'];

  const filteredExercises = exercisesList.filter((e) =>
    selectedMuscle === 'Todos' ? true : e.muscleGroup === selectedMuscle
  );

  const handleLogSet = () => {
    const success = logCurrentSet();
    if (!success) {
      Alert.alert('Atenção', 'Informe um peso e quantidade de repetições válidos.');
    }
  };

  const handleFinish = () => {
    Alert.alert('Finalizar Treino', 'Deseja concluir e salvar este treino no histórico?', [
      { text: 'Continuar Treinando', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: () => {
          finishCurrentWorkout();
          loadHistory();
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
          loadHistory();
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
          {/* Top Header */}
          <View style={styles.header}>
            <ThemedText type="header">
              {activeWorkout ? 'Treino em Andamento' : 'Treinos'}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {activeWorkout
                ? 'Registre suas séries e cargas em tempo real.'
                : 'Histórico de treinos e novas sessões.'}
            </ThemedText>
          </View>

          {/* MODO ATIVO: Se houver treino em andamento */}
          {activeWorkout ? (
            <View style={styles.activeContainer}>
              {/* Card de Controle da Sessão */}
              <View
                style={[
                  styles.sessionHeaderCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}>
                <View style={styles.sessionHeaderRow}>
                  <View>
                    <ThemedText type="caption" style={{ color: theme.primary }}>
                      Sessão Ativa
                    </ThemedText>
                    <ThemedText type="title">{activeWorkout.name}</ThemedText>
                  </View>
                  <Pressable
                    onPress={handleFinish}
                    style={({ pressed }) => [
                      styles.finishButton,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <ThemedText type="smallBold" style={styles.finishButtonText}>
                      Finalizar
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Filtro de Músculo */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.muscleScroll}>
                {muscles.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setSelectedMuscle(m)}
                    style={[
                      styles.muscleChip,
                      {
                        backgroundColor:
                          selectedMuscle === m ? theme.primary : theme.card,
                        borderColor:
                          selectedMuscle === m ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: selectedMuscle === m ? '#FFFFFF' : theme.textSecondary,
                      }}>
                      {m}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Seletor Rápido de Exercício */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Exercício</ThemedText>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exerciseScroll}>
                {filteredExercises.map((ex) => {
                  const isSelected = selectedExercise?.id === ex.id;
                  return (
                    <Pressable
                      key={ex.id}
                      onPress={() => selectExercise(ex)}
                      style={[
                        styles.exerciseChip,
                        {
                          backgroundColor: isSelected ? theme.cardElevated : theme.card,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                        },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: isSelected ? theme.primary : theme.text }}>
                        {ex.name}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textMuted }}>
                        {ex.muscleGroup}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Painel de Registro de Série */}
              {selectedExercise && (
                <View
                  style={[
                    styles.logCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <ThemedText type="title" style={{ color: theme.text }}>
                    {selectedExercise.name}
                  </ThemedText>

                  <View style={styles.inputsRow}>
                    <View style={styles.inputGroup}>
                      <ThemedText type="caption">Carga (kg)</ThemedText>
                      <TextInput
                        value={weightInput}
                        onChangeText={setWeightInput}
                        placeholder="Ex: 80"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.backgroundElevated,
                            borderColor: theme.cardBorder,
                            color: theme.text,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <ThemedText type="caption">Repetições</ThemedText>
                      <TextInput
                        value={repsInput}
                        onChangeText={setRepsInput}
                        placeholder="Ex: 10"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="number-pad"
                        style={[
                          styles.input,
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
                    onPress={handleLogSet}
                    style={({ pressed }) => [
                      styles.logButton,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <ThemedText type="smallBold" style={styles.logButtonText}>
                      + Registrar Série
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Séries Registradas no Treino Atual */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Séries do Treino ({activeWorkout.sets.length})</ThemedText>
              </View>

              {activeWorkout.sets.length === 0 ? (
                <View
                  style={[
                    styles.emptyStateCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Nenhuma série registrada neste treino ainda.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.setsList}>
                  {activeWorkout.sets.map((s, idx) => (
                    <View
                      key={s.id}
                      style={[
                        styles.setItem,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      ]}>
                      <View style={styles.setItemLeft}>
                        <View
                          style={[
                            styles.setNumberBadge,
                            { backgroundColor: theme.backgroundElevated },
                          ]}>
                          <ThemedText type="smallBold" style={{ color: theme.primary }}>
                            #{idx + 1}
                          </ThemedText>
                        </View>
                        <View>
                          <ThemedText type="smallBold">
                            {s.exercise?.name ?? 'Exercício'}
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            {s.weightKg} kg × {s.reps} reps
                          </ThemedText>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => deleteSet(s.id)}
                        hitSlop={8}
                        style={styles.deleteSetButton}>
                        <ThemedText type="small" style={{ color: theme.danger }}>
                          Remover
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={handleCancel}
                style={[styles.cancelButton, { borderColor: theme.cardBorder }]}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Descartar Treino
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            /* MODO INATIVO: Lista de Treinos e Botão de Iniciar */
            <View style={styles.inactiveContainer}>
              <Pressable
                onPress={() => startNewWorkout()}
                style={({ pressed }) => [
                  styles.startBigButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                ]}>
                <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                  + Iniciar Novo Treino
                </ThemedText>
              </Pressable>

              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Histórico de Treinos</ThemedText>
              </View>

              {history.length === 0 ? (
                <View
                  style={[
                    styles.emptyStateCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <ThemedText type="default" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhum histórico registrado.
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textMuted, textAlign: 'center', marginTop: 4 }}>
                    Ao finalizar seu primeiro treino, ele aparecerá aqui com todos os detalhes.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {history.map((w) => (
                    <View
                      key={w.id}
                      style={[
                        styles.historyCard,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      ]}>
                      <View style={styles.historyCardHeader}>
                        <View>
                          <ThemedText type="title">{w.name}</ThemedText>
                          <ThemedText type="caption" style={{ color: theme.textMuted }}>
                            {new Date(w.startedAt).toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: theme.backgroundElevated }]}>
                          <ThemedText type="caption" style={{ color: theme.primary }}>
                            {w.sets.length} séries
                          </ThemedText>
                        </View>
                      </View>

                      {w.sets.length > 0 && (
                        <View style={styles.historySetsPreview}>
                          {w.sets.slice(0, 3).map((s, idx) => (
                            <ThemedText key={idx} type="small" style={{ color: theme.textSecondary }}>
                              • {s.exercise?.name}: {s.weightKg}kg × {s.reps}
                            </ThemedText>
                          ))}
                          {w.sets.length > 3 && (
                            <ThemedText type="caption" style={{ color: theme.textMuted }}>
                              + {w.sets.length - 3} outras séries
                            </ThemedText>
                          )}
                        </View>
                      )}
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
  activeContainer: {
    gap: Spacing.lg,
  },
  sessionHeaderCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finishButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  finishButtonText: {
    color: '#FFFFFF',
  },
  muscleScroll: {
    gap: Spacing.xs,
  },
  muscleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  exerciseScroll: {
    gap: Spacing.sm,
  },
  exerciseChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 140,
    gap: 2,
  },
  logCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  logButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
  },
  setsList: {
    gap: Spacing.xs,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  setItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  setNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSetButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
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
  startBigButton: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyList: {
    gap: Spacing.md,
  },
  historyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
  },
  historySetsPreview: {
    gap: 4,
    marginTop: Spacing.xs,
  },
});
