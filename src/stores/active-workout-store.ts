import { create } from 'zustand';

import { Exercise } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import { workoutRepository, WorkoutWithSets } from '@/features/workouts/workout-repository';

interface ActiveWorkoutState {
  activeWorkout: WorkoutWithSets | null;
  exercisesList: Exercise[];
  selectedExercise: Exercise | null;
  weightInput: string;
  repsInput: string;

  // Actions
  initialize: () => void;
  startNewWorkout: (name?: string) => void;
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
  exercisesList: [],
  selectedExercise: null,
  weightInput: '',
  repsInput: '',

  initialize: () => {
    const allExercises = exerciseRepository.getAll();
    set({
      exercisesList: allExercises,
      selectedExercise: allExercises[0] ?? null,
    });
  },

  startNewWorkout: (name) => {
    const workoutId = `wk_${Date.now()}`;
    const workoutName = name || `Treino #${new Date().toLocaleDateString('pt-BR')}`;
    const now = Date.now();

    workoutRepository.create({
      id: workoutId,
      name: workoutName,
      startedAt: now,
      completedAt: null,
      notes: null,
    });

    const created = workoutRepository.getById(workoutId);
    const allExercises = exerciseRepository.getAll();

    set({
      activeWorkout: created,
      exercisesList: allExercises,
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

    if (isNaN(weight) || isNaN(reps) || reps <= 0) {
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
    });
  },
}));
