import { desc, eq, gte } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  workoutSessions,
  sessionSets,
  exercises,
  type WorkoutSession,
  type NewWorkoutSession,
  type SessionSet,
  type NewSessionSet,
  type Exercise,
} from '@/database/schema';

export interface WorkoutWithSets extends WorkoutSession {
  sets: (SessionSet & { exercise: Exercise | null })[];
}

export const workoutRepository = {
  getAll(): WorkoutSession[] {
    return db.select().from(workoutSessions).orderBy(desc(workoutSessions.startedAt)).all();
  },

  getById(id: string): WorkoutWithSets | null {
    const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
    if (!session) return null;

    const sets = db
      .select({
        set: sessionSets,
        exercise: exercises,
      })
      .from(sessionSets)
      .leftJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
      .where(eq(sessionSets.sessionId, id))
      .orderBy(sessionSets.completedAt)
      .all()
      .map((row) => ({
        ...row.set,
        exercise: row.exercise,
      }));

    return {
      ...session,
      sets,
    };
  },

  create(session: NewWorkoutSession): WorkoutSession {
    db.insert(workoutSessions).values(session).run();
    return session as WorkoutSession;
  },

  complete(id: string, notes?: string): void {
    db.update(workoutSessions)
      .set({
        completedAt: Date.now(),
        notes: notes ?? null,
      })
      .where(eq(workoutSessions.id, id))
      .run();
  },

  delete(id: string): void {
    db.delete(workoutSessions).where(eq(workoutSessions.id, id)).run();
  },

  addSet(set: NewSessionSet): SessionSet {
    db.insert(sessionSets).values(set).run();
    return set as SessionSet;
  },

  deleteSet(setId: string): void {
    db.delete(sessionSets).where(eq(sessionSets.id, setId)).run();
  },

  getWeeklySummary(): { workoutsCount: number; setsCount: number; totalTonnage: number } {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentWorkouts = db
      .select()
      .from(workoutSessions)
      .where(gte(workoutSessions.startedAt, sevenDaysAgo))
      .all();

    const recentSets = db
      .select()
      .from(sessionSets)
      .where(gte(sessionSets.completedAt, sevenDaysAgo))
      .all();

    const totalTonnage = recentSets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);

    return {
      workoutsCount: recentWorkouts.length,
      setsCount: recentSets.length,
      totalTonnage: Math.round(totalTonnage),
    };
  },
};
