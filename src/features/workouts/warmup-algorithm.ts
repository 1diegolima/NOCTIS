import { Exercise } from '@/database/schema';

export interface PreparedSetSuggestion {
  type: 'warmup' | 'feeder' | 'working';
  label: string;
  weightKg: number;
  reps: number;
}

interface PreparationContext {
  exercise: Exercise;
  workingWeightKg: number;
  workingSetsCount: number;
  targetRepsMin: number;
  targetRepsMax: number;
  isFirstExerciseOfWorkout: boolean;
  isFirstExerciseOfMuscleGroup: boolean;
}

/**
 * Algoritmo de Aquecimento e Séries Preparatórias (Feeder Sets) do NOCTIS
 * Baseado em regras progressivas que respeitam:
 * - Carga de trabalho
 * - Exercício composto vs isolador
 * - Equipamento (barra, halter, cabo, máquina)
 * - Estado de aquecimento do grupo muscular
 */
export function calculatePreparationSets(ctx: PreparationContext): PreparedSetSuggestion[] {
  const {
    exercise,
    workingWeightKg,
    workingSetsCount,
    targetRepsMin,
    isFirstExerciseOfWorkout,
    isFirstExerciseOfMuscleGroup,
  } = ctx;

  const suggestions: PreparedSetSuggestion[] = [];

  // Se a carga for muito baixa (< 25kg) ou for isolador em músculo já aquecido, simplifica
  if (workingWeightKg <= 20 || (exercise.category === 'isolador' && !isFirstExerciseOfMuscleGroup)) {
    // Apenas as séries de trabalho
    for (let i = 1; i <= workingSetsCount; i++) {
      suggestions.push({
        type: 'working',
        label: `SÉRIE VÁLIDA ${i}`,
        weightKg: workingWeightKg,
        reps: targetRepsMin,
      });
    }
    return suggestions;
  }

  // 1. PRIMEIRO EXERCÍCIO DO TREINO OU DO GRUPO MUSCULAR (Demanda de preparação completa)
  if (isFirstExerciseOfWorkout || isFirstExerciseOfMuscleGroup) {
    if (exercise.category === 'composto') {
      // Warm-up inicial (barra vazia ou ~20-30% da carga)
      const baseBarWeight = exercise.equipment === 'barra' ? 20 : Math.max(10, Math.round((workingWeightKg * 0.25) / 2.5) * 2.5);
      if (workingWeightKg > 40) {
        suggestions.push({
          type: 'warmup',
          label: 'WARM-UP',
          weightKg: baseBarWeight,
          reps: 10,
        });
      }

      // Feeder 1 (~50-55%)
      if (workingWeightKg >= 50) {
        const feeder1Weight = Math.round((workingWeightKg * 0.55) / 2.5) * 2.5;
        suggestions.push({
          type: 'feeder',
          label: 'FEEDER 1',
          weightKg: feeder1Weight,
          reps: 5,
        });
      }

      // Feeder 2 (~75-80%)
      if (workingWeightKg >= 70) {
        const feeder2Weight = Math.round((workingWeightKg * 0.78) / 2.5) * 2.5;
        suggestions.push({
          type: 'feeder',
          label: 'FEEDER 2',
          weightKg: feeder2Weight,
          reps: 3,
        });
      }

      // Feeder 3 (~90%) para cargas pesadas (> 80kg)
      if (workingWeightKg >= 85) {
        const feeder3Weight = Math.round((workingWeightKg * 0.91) / 2.5) * 2.5;
        suggestions.push({
          type: 'feeder',
          label: 'FEEDER 3 (Aclimatização)',
          weightKg: feeder3Weight,
          reps: 1,
        });
      }
    } else {
      // Isolador no primeiro exercício do músculo (1 feeder leve)
      const feederWeight = Math.round((workingWeightKg * 0.7) / 2.5) * 2.5;
      suggestions.push({
        type: 'feeder',
        label: 'FEEDER (Reconhecimento)',
        weightKg: feederWeight,
        reps: 5,
      });
    }
  } else {
    // 2. EXERCÍCIO POSTERIOR DO MESMO GRUPO MUSCULAR (Músculo já aquecido)
    if (exercise.category === 'composto' && workingWeightKg >= 60) {
      // Apenas 1 feeder de reconhecimento do novo movimento (~75-80%)
      const feederWeight = Math.round((workingWeightKg * 0.78) / 2.5) * 2.5;
      suggestions.push({
        type: 'feeder',
        label: 'FEEDER (Reconhecimento do padrão)',
        weightKg: feederWeight,
        reps: 3,
      });
    }
  }

  // 3. SÉRIES VÁLIDAS / WORKING SETS
  for (let i = 1; i <= workingSetsCount; i++) {
    suggestions.push({
      type: 'working',
      label: `SÉRIE VÁLIDA ${i}`,
      weightKg: workingWeightKg,
      reps: targetRepsMin,
    });
  }

  return suggestions;
}
