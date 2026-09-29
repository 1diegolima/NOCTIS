import { eq } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  routines,
  routineWorkouts,
  routineExercises,
  exercises,
  type Routine,
  type RoutineWorkout,
  type RoutineExercise,
  type Exercise,
  type SplitType,
} from '@/database/schema';

export interface RoutineExerciseWithDetails extends RoutineExercise {
  exercise: Exercise | null;
}

export interface RoutineWorkoutWithExercises extends RoutineWorkout {
  exercises: RoutineExerciseWithDetails[];
}

export interface FullRoutine extends Routine {
  workouts: RoutineWorkoutWithExercises[];
}

export const routineRepository = {
  getActiveRoutine(): FullRoutine | null {
    const active = db.select().from(routines).where(eq(routines.isActive, 1)).get();
    if (!active) return null;

    const rWorkouts = db
      .select()
      .from(routineWorkouts)
      .where(eq(routineWorkouts.routineId, active.id))
      .orderBy(routineWorkouts.orderIndex)
      .all();

    const workoutsWithExercises: RoutineWorkoutWithExercises[] = rWorkouts.map((rw) => {
      const rExercises = db
        .select({
          routineExercise: routineExercises,
          exercise: exercises,
        })
        .from(routineExercises)
        .leftJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
        .where(eq(routineExercises.routineWorkoutId, rw.id))
        .orderBy(routineExercises.orderIndex)
        .all()
        .map((row) => ({
          ...row.routineExercise,
          exercise: row.exercise,
        }));

      return {
        ...rw,
        exercises: rExercises,
      };
    });

    return {
      ...active,
      workouts: workoutsWithExercises,
    };
  },

  getAllRoutines(): Routine[] {
    return db.select().from(routines).all();
  },

  createRoutine(name: string, splitType: SplitType): FullRoutine {
    const routineId = `routine_${Date.now()}`;
    const now = Date.now();

    // Desativa rotinas anteriores
    db.update(routines).set({ isActive: 0 }).run();

    db.insert(routines)
      .values({
        id: routineId,
        name,
        splitType,
        isActive: 1,
        createdAt: now,
      })
      .run();

    // Define os treinos padrão com base no split escolhido
    const splitMap: Record<SplitType, string[]> = {
      ppl_ul: ['Push (Empurrar)', 'Pull (Puxar)', 'Legs (Pernas)', 'Upper (Superior)', 'Lower (Inferior)'],
      ppl: ['Push (Peito, Ombro, Tríceps)', 'Pull (Costas, Bíceps)', 'Legs (Pernas Completo)'],
      upper_lower: ['Upper A (Superior)', 'Lower A (Inferior)', 'Upper B (Superior)', 'Lower B (Inferior)'],
      full_body: ['Full Body A', 'Full Body B', 'Full Body C'],
      custom: ['Sessão A', 'Sessão B', 'Sessão C'],
    };

    const workoutNames = splitMap[splitType] || ['Sessão A'];
    workoutNames.forEach((wName, idx) => {
      db.insert(routineWorkouts)
        .values({
          id: `rw_${Date.now()}_${idx}`,
          routineId,
          name: wName,
          orderIndex: idx + 1,
        })
        .run();
    });

    return this.getActiveRoutine()!;
  },

  addExerciseToWorkout(params: {
    routineWorkoutId: string;
    exerciseId: string;
    workingSets: number;
    repsMin: number;
    repsMax: number;
    workingWeightKg: number;
  }): void {
    const existing = db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineWorkoutId, params.routineWorkoutId))
      .all();

    const orderIndex = existing.length + 1;

    db.insert(routineExercises)
      .values({
        id: `re_${Date.now()}`,
        routineWorkoutId: params.routineWorkoutId,
        exerciseId: params.exerciseId,
        orderIndex,
        workingSets: params.workingSets || 2,
        repsMin: params.repsMin || 6,
        repsMax: params.repsMax || 10,
        workingWeightKg: params.workingWeightKg || 0,
        restSeconds: 120,
      })
      .run();
  },

  removeExerciseFromWorkout(routineExerciseId: string): void {
    db.delete(routineExercises).where(eq(routineExercises.id, routineExerciseId)).run();
  },

  updateExerciseConfig(params: {
    routineExerciseId: string;
    workingSets: number;
    repsMin: number;
    repsMax: number;
    workingWeightKg: number;
  }): void {
    db.update(routineExercises)
      .set({
        workingSets: params.workingSets,
        repsMin: params.repsMin,
        repsMax: params.repsMax,
        workingWeightKg: params.workingWeightKg,
      })
      .where(eq(routineExercises.id, params.routineExerciseId))
      .run();
  },
};
