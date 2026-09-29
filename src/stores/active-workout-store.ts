import { create } from 'zustand';

import { Exercise } from '@/database/schema';
import { exerciseRepository } from '@/features/exercises/exercise-repository';
import { workoutRepository, WorkoutWithSets } from '@/features/workouts/workout-repository';

// ─── Interface ─────────────────────────────────────────────────────────────

interface ActiveWorkoutState {
  /** Sessão de treino atualmente em execução (null se não há treino ativo) */
  activeWorkout: WorkoutWithSets | null;
  /** Exercício selecionado para registro de série */
  selectedExercise: Exercise | null;
  /** Input de carga atual */
  weightInput: string;
  /** Input de reps atual */
  repsInput: string;
  /** Anotação da sessão atual */
  sessionNotes: string;

  // ─── Actions ───────────────────────────────────────────────────────────
  /** Inicializa o store — tenta recuperar sessão ativa do banco */
  initialize: () => void;
  /** Inicia nova sessão de treino, opcionalmente vinculada a uma rotina */
  startNewWorkout: (name?: string, routineWorkoutId?: string) => void;
  selectExercise: (exercise: Exercise) => void;
  setWeightInput: (val: string) => void;
  setRepsInput: (val: string) => void;
  setSessionNotes: (val: string) => void;
  /** Registra uma série com o exercício/carga/reps atuais. Retorna true em sucesso. */
  logCurrentSet: (type?: 'warmup' | 'feeder' | 'working') => boolean;
  /** Remove uma série pelo ID */
  deleteSet: (setId: string) => void;
  /** Remove a última série registrada no treino ativo */
  undoLastSet: () => void;
  /** Finaliza e persiste o treino atual */
  finishCurrentWorkout: (notes?: string) => void;
  /** Cancela e deleta o treino atual */
  cancelCurrentWorkout: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  activeWorkout: null,
  selectedExercise: null,
  weightInput: '',
  repsInput: '',
  sessionNotes: '',

  initialize: () => {
    const allSessions = workoutRepository.getAll();
    const inProgress = allSessions.find((s) => s.completedAt === null);

    if (inProgress) {
      const full = workoutRepository.getById(inProgress.id);
      const allExercises = exerciseRepository.getAll();
      const lastSet = full?.sets[full.sets.length - 1];
      const lastExercise = lastSet
        ? (allExercises.find((e) => e.id === lastSet.exerciseId) ?? null)
        : null;

      set({
        activeWorkout: full,
        selectedExercise: lastExercise ?? allExercises[0] ?? null,
        weightInput: lastSet ? lastSet.weightKg.toString() : '',
        repsInput: '',
        sessionNotes: inProgress.notes ?? '',
      });
    } else {
      set({ activeWorkout: null, sessionNotes: '' });
    }
  },

  startNewWorkout: (name?: string, routineWorkoutId?: string) => {
    const workoutId = `wk_${Date.now()}`;
    const workoutName = name || `Treino — ${new Date().toLocaleDateString('pt-BR')}`;

    workoutRepository.create({
      id: workoutId,
      routineWorkoutId: routineWorkoutId ?? null,
      name: workoutName,
      startedAt: Date.now(),
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
      sessionNotes: '',
    });
  },

  selectExercise: (exercise) => set({ selectedExercise: exercise }),

  setWeightInput: (val) => set({ weightInput: val }),
  setRepsInput: (val) => set({ repsInput: val }),
  setSessionNotes: (val) => set({ sessionNotes: val }),

  logCurrentSet: (type = 'working') => {
    const { activeWorkout, selectedExercise, weightInput, repsInput } = get();
    if (!activeWorkout || !selectedExercise) return false;

    const weight = parseFloat(weightInput.replace(',', '.'));
    const reps = parseInt(repsInput, 10);

    if (isNaN(weight) || isNaN(reps) || reps <= 0 || weight <= 0) return false;

    const currentSetsForExercise = activeWorkout.sets.filter(
      (s) => s.exerciseId === selectedExercise.id
    );
    const newSetNumber = currentSetsForExercise.length + 1;

    workoutRepository.addSet({
      id: `set_${Date.now()}`,
      sessionId: activeWorkout.id,
      exerciseId: selectedExercise.id,
      type,
      setNumber: newSetNumber,
      weightKg: weight,
      reps,
      isCompleted: 1,
      completedAt: Date.now(),
    });

    const updatedWorkout = workoutRepository.getById(activeWorkout.id);
    set({ activeWorkout: updatedWorkout, repsInput: '' });
    return true;
  },

  deleteSet: (setId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    workoutRepository.deleteSet(setId);
    const updatedWorkout = workoutRepository.getById(activeWorkout.id);
    set({ activeWorkout: updatedWorkout });
  },

  undoLastSet: () => {
    const { activeWorkout } = get();
    if (!activeWorkout || activeWorkout.sets.length === 0) return;
    const lastSet = activeWorkout.sets[activeWorkout.sets.length - 1];
    workoutRepository.deleteSet(lastSet.id);
    const updatedWorkout = workoutRepository.getById(activeWorkout.id);
    set({ activeWorkout: updatedWorkout });
  },

  finishCurrentWorkout: (notes?: string) => {
    const { activeWorkout, sessionNotes } = get();
    if (!activeWorkout) return;
    workoutRepository.complete(activeWorkout.id, notes ?? sessionNotes ?? undefined);
    set({ activeWorkout: null, weightInput: '', repsInput: '', selectedExercise: null, sessionNotes: '' });
  },

  cancelCurrentWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    workoutRepository.delete(activeWorkout.id);
    set({ activeWorkout: null, weightInput: '', repsInput: '', selectedExercise: null, sessionNotes: '' });
  },
}));
