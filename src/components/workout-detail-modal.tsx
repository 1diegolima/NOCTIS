/**
 * WorkoutDetailModal.tsx
 *
 * Modal que exibe os detalhes completos de uma sessão de treino histórica:
 * - Duração, tonelagem e volume total
 * - Anotações da sessão (Session Notes)
 * - Lista detalhada de todos os exercícios e séries executadas com 1RM estimada
 * - Opção de exclusão com confirmação
 */

import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { Exercise } from '@/database/schema';
import { calculateOneRepMax, workoutRepository, WorkoutSetWithExercise, WorkoutWithSets } from '@/features/workouts/workout-repository';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

interface Props {
  workoutId: string | null;
  visible: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function WorkoutDetailModal({ workoutId, visible, onClose, onDeleted }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!workoutId || !visible) return null;

  const workout: WorkoutWithSets | null = workoutRepository.getById(workoutId);

  if (!workout) return null;

  const startedDate = new Date(workout.startedAt);
  const formattedDate = startedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = startedDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const durationMin = workout.completedAt
    ? Math.max(1, Math.round((workout.completedAt - workout.startedAt) / 60000))
    : Math.max(1, Math.round((Date.now() - workout.startedAt) / 60000));

  const totalTonnage = Math.round(
    workout.sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0)
  );

  // Agrupa séries por exercício mantendo a ordem de execução
  const exerciseGroups: { exercise: Exercise | null; sets: WorkoutSetWithExercise[] }[] = [];
  const exerciseMap = new Map<string, { exercise: Exercise | null; sets: WorkoutSetWithExercise[] }>();

  for (const s of workout.sets) {
    const key = s.exerciseId;
    if (!exerciseMap.has(key)) {
      const group = { exercise: s.exercise, sets: [] as WorkoutSetWithExercise[] };
      exerciseMap.set(key, group);
      exerciseGroups.push(group);
    }
    exerciseMap.get(key)!.sets.push(s);
  }

  const handleDelete = () => {
    Alert.alert(
      'Excluir Treino',
      'Tem certeza de que deseja apagar permanentemente este treino do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            haptics.heavy();
            workoutRepository.delete(workout.id);
            onClose();
            if (onDeleted) onDeleted();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.cardElevated,
              borderColor: theme.cardBorder,
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                DETALHES DO TREINO
              </ThemedText>
              <ThemedText type="title" numberOfLines={1}>
                {workout.name}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2, textTransform: 'capitalize' }}>
                {formattedDate} às {formattedTime}
              </ThemedText>
            </View>

            <Pressable
              onPress={() => {
                haptics.light();
                onClose();
              }}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundElevated }]}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Cards de Métricas */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                DURAÇÃO
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.primary, marginTop: 2 }}>
                {durationMin} min
              </ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                SÉRIES
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.text, marginTop: 2 }}>
                {workout.sets.length}
              </ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                TONELAGEM
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.text, marginTop: 2 }}>
                {totalTonnage} kg
              </ThemedText>
            </View>
          </View>

          {/* Anotações da Sessão (se houver) */}
          {workout.notes && workout.notes.trim().length > 0 && (
            <View style={[styles.notesCard, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                📝 ANOTAÇÕES DA SESSÃO
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.text, marginTop: 4 }}>
                {workout.notes}
              </ThemedText>
            </View>
          )}

          {/* Lista de Exercícios e Séries */}
          <ThemedText type="caption" style={{ color: theme.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.xs }}>
            EXERCÍCIOS REALIZADOS ({exerciseGroups.length})
          </ThemedText>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {exerciseGroups.map((group, gIdx) => (
              <View
                key={gIdx}
                style={[styles.exerciseBlock, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.exerciseBlockHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">
                      {group.exercise?.name ?? 'Exercício'}
                    </ThemedText>
                    {group.exercise?.muscleGroup && (
                      <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: 'capitalize' }}>
                        {group.exercise.muscleGroup}
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
                    {group.sets.length} séries
                  </ThemedText>
                </View>

                {/* Tabela de Séries */}
                <View style={styles.setsTable}>
                  <View style={styles.tableHeaderRow}>
                    <ThemedText type="caption" style={[styles.tableCol, { color: theme.textMuted, flex: 0.8 }]}>SÉRIE</ThemedText>
                    <ThemedText type="caption" style={[styles.tableCol, { color: theme.textMuted, flex: 1.2 }]}>CARGA</ThemedText>
                    <ThemedText type="caption" style={[styles.tableCol, { color: theme.textMuted, flex: 1.2 }]}>REPS</ThemedText>
                    <ThemedText type="caption" style={[styles.tableCol, { color: theme.textMuted, flex: 1.5, textAlign: 'right' }]}>1RM ESTIMADA</ThemedText>
                  </View>

                  {group.sets.map((set, sIdx) => {
                    const oneRm = calculateOneRepMax(set.weightKg, set.reps);
                    return (
                      <View
                        key={set.id || sIdx}
                        style={[
                          styles.tableRow,
                          { borderTopColor: 'rgba(255, 255, 255, 0.04)', borderTopWidth: 1 },
                        ]}>
                        <ThemedText type="caption" style={[styles.tableCol, { color: theme.primary, fontWeight: '700', flex: 0.8 }]}>
                          #{sIdx + 1}
                        </ThemedText>
                        <ThemedText type="caption" style={[styles.tableCol, { color: theme.text, flex: 1.2 }]}>
                          {set.weightKg} kg
                        </ThemedText>
                        <ThemedText type="caption" style={[styles.tableCol, { color: theme.text, flex: 1.2 }]}>
                          {set.reps} reps
                        </ThemedText>
                        <ThemedText type="caption" style={[styles.tableCol, { color: theme.primaryHover, fontWeight: '700', flex: 1.5, textAlign: 'right' }]}>
                          ~{oneRm} kg
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Rodapé com Ações */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={handleDelete}
              style={[styles.deleteBtn, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
                🗑️ Excluir
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.light();
                onClose();
              }}
              style={[styles.closeBottomBtn, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                Fechar
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  notesCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  scrollList: {
    maxHeight: 320,
  },
  exerciseBlock: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  exerciseBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setsTable: {
    marginTop: Spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'center',
  },
  tableCol: {
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  deleteBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
