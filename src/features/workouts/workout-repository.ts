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

  getWorkoutDaysThisWeek(): Set<number> {
    // Retorna os dias da semana (0=Dom, 1=Seg, ..., 6=Sáb) com treino concluído na semana atual
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom, 1=Seg ...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const sessions = db
      .select()
      .from(workoutSessions)
      .where(gte(workoutSessions.startedAt, weekStart.getTime()))
      .all()
      .filter((s) => s.completedAt !== null && s.startedAt < weekEnd.getTime());

    const days = new Set<number>();
    for (const s of sessions) {
      days.add(new Date(s.startedAt).getDay());
    }
    return days;
  },

  /**
   * Retorna o último registro de carga e repetições de um determinado exercício
   */
  getLastExercisePerformance(
    exerciseId: string
  ): { weightKg: number; reps: number; completedAt: number } | null {
    const lastSet = db
      .select({
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
        completedAt: sessionSets.completedAt,
      })
      .from(sessionSets)
      .where(eq(sessionSets.exerciseId, exerciseId))
      .orderBy(desc(sessionSets.completedAt))
      .limit(1)
      .get();

    return lastSet ?? null;
  },

  /**
   * Retorna os IDs das sessões de rotina (routineWorkoutId) já concluídas hoje
   */
  getCompletedRoutineWorkoutIdsToday(): Set<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const completed = db
      .select()
      .from(workoutSessions)
      .where(gte(workoutSessions.startedAt, todayTimestamp))
      .all()
      .filter((s) => s.completedAt !== null && s.routineWorkoutId !== null);

    const ids = new Set<string>();
    for (const s of completed) {
      if (s.routineWorkoutId) {
        ids.add(s.routineWorkoutId);
      }
    }
    return ids;
  },
};
