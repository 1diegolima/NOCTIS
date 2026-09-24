import { create } from 'zustand';

import { Exercise } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import { workoutRepository, WorkoutWithSets } from '@/features/workouts/workout-repository';

interface ActiveWorkoutState {
  /** Sessão de treino atualmente em execução (null se não há treino ativo) */
  activeWorkout: WorkoutWithSets | null;
  /** Exercício selecionado para registro de série */
  selectedExercise: Exercise | null;
  /** Input de carga atual */
  weightInput: string;
  /** Input de reps atual */
  repsInput: string;

  // Actions
  /** Inicializa o store — tenta recuperar sessão ativa do banco */
  initialize: () => void;
  /**
   * Inicia uma nova sessão de treino.
   * @param name - Nome da sessão
   * @param routineWorkoutId - ID do routine_workout que originou a sessão
   */
  startNewWorkout: (name?: string, routineWorkoutId?: string) => void;
  selectExercise: (exercise: Exercise) => void;
  setWeightInput: (val: string) => void;
  setRepsInput: (val: string) => void;
  logCurrentSet: (type?: 'warmup' | 'feeder' | 'working') => boolean;
  deleteSet: (setId: string) => void;
  finishCurrentWorkout: () => void;
  cancelCurrentWorkout: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  activeWorkout: null,
  selectedExercise: null,
  weightInput: '',
  repsInput: '',

  initialize: () => {
    // Tenta recuperar sessão em andamento (completedAt IS NULL) do banco
    const allSessions = workoutRepository.getAll();
    const inProgress = allSessions.find((s) => s.completedAt === null);

    if (inProgress) {
      const full = workoutRepository.getById(inProgress.id);
      const allExercises = exerciseRepository.getAll();
      // Restaurar exercício selecionado — usa o último exercício registrado ou o primeiro
      const lastSet = full?.sets[full.sets.length - 1];
      const lastExercise = lastSet
        ? allExercises.find((e) => e.id === lastSet.exerciseId) ?? null
        : null;

      set({
        activeWorkout: full,
        selectedExercise: lastExercise ?? allExercises[0] ?? null,
        weightInput: lastSet ? lastSet.weightKg.toString() : '',
        repsInput: '',
      });
    } else {
      set({ activeWorkout: null });
    }
  },

  startNewWorkout: (name?: string, routineWorkoutId?: string) => {
    const workoutId = `wk_${Date.now()}`;
    const now = Date.now();
    const workoutName = name || `Treino - ${new Date().toLocaleDateString('pt-BR')}`;

    workoutRepository.create({
      id: workoutId,
      routineWorkoutId: routineWorkoutId ?? null,
      name: workoutName,
      startedAt: now,
      completedAt: null,
      notes: null,
    });

    const created = workoutRepository.getById(workoutId);
    const allExercises = exerciseRepository.getAll();

    set({
      activeWorkout: created,
      selectedExercise: allExercises[0] ?? null,
      weightInput: '',
      repsInput: '',
    });
  },

  selectExercise: (exercise) => {
    set({ selectedExercise: exercise });
  },

  setWeightInput: (val) => set({ weightInput: val }),
  setRepsInput: (val) => set({ repsInput: val }),

  logCurrentSet: (type = 'working') => {
    const { activeWorkout, selectedExercise, weightInput, repsInput } = get();
    if (!activeWorkout || !selectedExercise) return false;

    const weight = parseFloat(weightInput.replace(',', '.'));
    const reps = parseInt(repsInput, 10);

    if (isNaN(weight) || isNaN(reps) || reps <= 0 || weight <= 0) {
      return false;
    }

    const currentSetsForExercise = activeWorkout.sets.filter(
      (s) => s.exerciseId === selectedExercise.id
    );

    const newSetNumber = currentSetsForExercise.length + 1;
    const setId = `set_${Date.now()}`;

    workoutRepository.addSet({
      id: setId,
      sessionId: activeWorkout.id,
      exerciseId: selectedExercise.id,
      type,
      setNumber: newSetNumber,
      weightKg: weight,
      reps: reps,
      isCompleted: 1,
      completedAt: Date.now(),
    });

    const updatedWorkout = workoutRepository.getById(activeWorkout.id);
    set({
      activeWorkout: updatedWorkout,
      repsInput: '',
    });

    return true;
  },

  deleteSet: (setId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    workoutRepository.deleteSet(setId);
    const updatedWorkout = workoutRepository.getById(activeWorkout.id);
    set({ activeWorkout: updatedWorkout });
  },

  finishCurrentWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    workoutRepository.complete(activeWorkout.id);
    set({
      activeWorkout: null,
      weightInput: '',
      repsInput: '',
      selectedExercise: null,
    });
  },

  cancelCurrentWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    workoutRepository.delete(activeWorkout.id);
    set({
      activeWorkout: null,
      weightInput: '',
      repsInput: '',
      selectedExercise: null,
    });
  },
}));
