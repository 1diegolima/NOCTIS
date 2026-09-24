import { desc, eq, gte } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  workouts,
  workoutSets,
  exercises,
  type Workout,
  type NewWorkout,
  type WorkoutSet,
  type NewWorkoutSet,
  type Exercise,
} from '@/database/schema';

export interface WorkoutWithSets extends Workout {
  sets: (WorkoutSet & { exercise: Exercise | null })[];
}

export const workoutRepository = {
  getAll(): Workout[] {
    return db.select().from(workouts).orderBy(desc(workouts.startedAt)).all();
  },

  getById(id: string): WorkoutWithSets | null {
    const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
    if (!workout) return null;

    const sets = db
      .select({
        set: workoutSets,
        exercise: exercises,
      })
      .from(workoutSets)
      .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(eq(workoutSets.workoutId, id))
      .orderBy(workoutSets.completedAt)
      .all()
      .map((row) => ({
        ...row.set,
        exercise: row.exercise,
      }));

    return {
      ...workout,
      sets,
    };
  },

  create(workout: NewWorkout): Workout {
    db.insert(workouts).values(workout).run();
    return workout as Workout;
  },

  complete(id: string, notes?: string): void {
    db.update(workouts)
      .set({
        completedAt: Date.now(),
        notes: notes ?? null,
      })
      .where(eq(workouts.id, id))
      .run();
  },

  delete(id: string): void {
    db.delete(workouts).where(eq(workouts.id, id)).run();
  },

  addSet(set: NewWorkoutSet): WorkoutSet {
    db.insert(workoutSets).values(set).run();
    return set as WorkoutSet;
  },

  deleteSet(setId: string): void {
    db.delete(workoutSets).where(eq(workoutSets.id, setId)).run();
  },

  getSetsForWorkout(workoutId: string): (WorkoutSet & { exercise: Exercise | null })[] {
    return db
      .select({
        set: workoutSets,
        exercise: exercises,
      })
      .from(workoutSets)
      .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(eq(workoutSets.workoutId, workoutId))
      .orderBy(workoutSets.completedAt)
      .all()
      .map((row) => ({
        ...row.set,
        exercise: row.exercise,
      }));
  },

  /**
   * Retorna os dados agregados dos últimos 7 dias
   */
  getWeeklySummary(): { workoutsCount: number; setsCount: number; totalTonnage: number } {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentWorkouts = db
      .select()
      .from(workouts)
      .where(gte(workouts.startedAt, sevenDaysAgo))
      .all();

    const recentSets = db
      .select()
      .from(workoutSets)
      .where(gte(workoutSets.completedAt, sevenDaysAgo))
      .all();

    const totalTonnage = recentSets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);

    return {
      workoutsCount: recentWorkouts.length,
      setsCount: recentSets.length,
      totalTonnage: Math.round(totalTonnage),
    };
  },
};
