import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { Exercise, MuscleGroup } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

const MUSCLE_GROUPS: (MuscleGroup | 'Todos')[] = [
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

const EQUIPMENTS = [
  { id: 'todos', label: 'Todos Equip.' },
  { id: 'barra', label: 'Barra' },
  { id: 'halter', label: 'Halter' },
  { id: 'cabo', label: 'Cabo' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'peso_corporal', label: 'Corporal' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  excludeExerciseIds?: string[];
  title?: string;
}

export function ExerciseSelectorModal({
  visible,
  onClose,
  onSelectExercise,
  excludeExerciseIds = [],
  title = 'Selecionar Exercício',
}: Props) {
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');

  const allExercises = useMemo(() => {
    if (!visible) return [];
    try {
      return exerciseRepository.getAll();
    } catch {
      return [];
    }
  }, [visible]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      if (excludeExerciseIds.includes(ex.id)) return false;

      // Filtro por músculo
      if (selectedMuscle !== 'Todos' && ex.muscleGroup !== selectedMuscle) {
        return false;
      }

      // Filtro por equipamento
      if (selectedEquipment !== 'todos' && ex.equipment !== selectedEquipment) {
        return false;
      }

      // Filtro textual
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allExercises, excludeExerciseIds, selectedMuscle, selectedEquipment, searchQuery]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      />
      <View
        style={[
          styles.content,
          { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder },
        ]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
              BIBLIOTECA DE EXERCÍCIOS
            </ThemedText>
            <ThemedText type="title">{title}</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
            hitSlop={12}
            style={styles.closeBtn}>
            <ThemedText type="title" style={{ color: theme.textSecondary }}>
              ✕
            </ThemedText>
          </Pressable>
        </View>

        {/* Barra de Busca Instantânea */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder },
          ]}>
          <ThemedText type="default">🔍</ThemedText>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nome, músculo..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                ✕
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Filtro por Grupo Muscular */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterScrollView}>
          {MUSCLE_GROUPS.map((m) => {
            const isSel = selectedMuscle === m;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  haptics.light();
                  setSelectedMuscle(m);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? theme.primary : theme.backgroundElevated,
                    borderColor: isSel ? theme.primary : theme.cardBorder,
                  },
                ]}>
                <ThemedText
                  type="caption"
                  style={{
                    color: isSel ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: isSel ? '700' : '500',
                  }}>
                  {m}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filtro por Equipamento */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterScrollViewSec}>
          {EQUIPMENTS.map((eq) => {
            const isSel = selectedEquipment === eq.id;
            return (
              <Pressable
                key={eq.id}
                onPress={() => {
                  haptics.light();
                  setSelectedEquipment(eq.id);
                }}
                style={[
                  styles.miniFilterChip,
                  {
                    backgroundColor: isSel ? theme.primaryDark : 'transparent',
                    borderColor: isSel ? theme.primary : theme.cardBorder,
                  },
                ]}>
                <ThemedText
                  type="caption"
                  style={{
                    fontSize: 11,
                    color: isSel ? theme.primaryHover : theme.textMuted,
                    fontWeight: isSel ? '700' : '500',
                  }}>
                  {eq.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Contagem de Resultados */}
        <View style={styles.resultsInfo}>
          <ThemedText type="caption" style={{ color: theme.textMuted }}>
            {filteredExercises.length} {filteredExercises.length === 1 ? 'exercício encontrado' : 'exercícios encontrados'}
          </ThemedText>
        </View>

        {/* Lista de Exercícios */}
        <ScrollView
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {filteredExercises.length === 0 ? (
            <View style={styles.emptyResultsBox}>
              <ThemedText type="default" style={{ color: theme.textSecondary }}>
                Nenhum exercício encontrado para os filtros selecionados.
              </ThemedText>
            </View>
          ) : (
            filteredExercises.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  haptics.medium();
                  onSelectExercise(item);
                  onClose();
                }}
                style={[
                  styles.exerciseCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <View style={styles.badgeRow}>
                    <View style={[styles.microBadge, { backgroundColor: theme.backgroundElevated }]}>
                      <ThemedText type="caption" style={{ color: theme.primaryHover, fontSize: 10 }}>
                        {item.muscleGroup}
                      </ThemedText>
                    </View>
                    <View style={[styles.microBadge, { backgroundColor: theme.backgroundElevated }]}>
                      <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 10 }}>
                        {item.equipment}
                      </ThemedText>
                    </View>
                    {item.category && (
                      <View style={[styles.microBadge, { backgroundColor: theme.backgroundElevated }]}>
                        <ThemedText type="caption" style={{ color: theme.textMuted, fontSize: 10 }}>
                          {item.category}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                <ThemedText type="title" style={{ color: theme.primary }}>
                  +
                </ThemedText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
  },
  filterScrollView: {
    maxHeight: 36,
    marginBottom: 6,
  },
  filterScrollViewSec: {
    maxHeight: 32,
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  miniFilterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  resultsInfo: {
    paddingVertical: 4,
    marginBottom: Spacing.xs,
  },
  exerciseList: {
    maxHeight: 360,
  },
  emptyResultsBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  microBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
});
