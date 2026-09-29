import { desc, eq, gte } from 'drizzle-orm';

import { db } from '@/database/client';
import { exercises, sessionSets, workoutSessions, type Exercise } from '@/database/schema';
import { calculateOneRepMax } from '@/features/workouts/workout-repository';

export interface ExercisePRItem {
  exercise: Exercise;
  maxWeight: number;
  max1RM: number;
  bestRepsAtMaxWeight: number;
  totalSetsLogged: number;
  lastPerformedAt: number;
}

export interface MuscleVolumeItem {
  muscleGroup: string;
  setsCount: number;
  tonnage: number;
}

export interface WeeklyTrendItem {
  weekLabel: string;
  workoutsCount: number;
  setsCount: number;
  tonnage: number;
}

export interface ExerciseProgressionPoint {
  date: string;
  timestamp: number;
  weightKg: number;
  reps: number;
  estimated1RM: number;
}

export const analyticsRepository = {
  /**
   * Retorna os recordes pessoais (PRs) de todos os exercícios registrados
   */
  getAllPRs(): ExercisePRItem[] {
    const allExercises = db.select().from(exercises).all();
    const allSets = db.select().from(sessionSets).orderBy(desc(sessionSets.completedAt)).all();

    const result: ExercisePRItem[] = [];

    for (const ex of allExercises) {
      const exSets = allSets.filter((s) => s.exerciseId === ex.id && s.type === 'working');
      if (exSets.length === 0) continue;

      let maxWeight = 0;
      let max1RM = 0;
      let bestRepsAtMaxWeight = 0;

      for (const s of exSets) {
        if (s.weightKg > maxWeight) {
          maxWeight = s.weightKg;
          bestRepsAtMaxWeight = s.reps;
        }
        const est1rm = calculateOneRepMax(s.weightKg, s.reps);
        if (est1rm > max1RM) {
          max1RM = est1rm;
        }
      }

      result.push({
        exercise: ex,
        maxWeight,
        max1RM,
        bestRepsAtMaxWeight,
        totalSetsLogged: exSets.length,
        lastPerformedAt: exSets[0]?.completedAt || 0,
      });
    }

    return result.sort((a, b) => b.lastPerformedAt - a.lastPerformedAt);
  },

  /**
   * Retorna o volume (número de séries de trabalho e tonelagem) por grupo muscular nos últimos 7 dias
   */
  getMuscleGroupVolumeThisWeek(): MuscleVolumeItem[] {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentSets = db
      .select({
        set: sessionSets,
        exercise: exercises,
      })
      .from(sessionSets)
      .leftJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
      .where(gte(sessionSets.completedAt, sevenDaysAgo))
      .all();

    const groups: Record<string, { setsCount: number; tonnage: number }> = {};

    for (const row of recentSets) {
      if (!row.exercise || row.set.type !== 'working') continue;
      const group = row.exercise.muscleGroup;
      if (!groups[group]) {
        groups[group] = { setsCount: 0, tonnage: 0 };
      }
      groups[group].setsCount += 1;
      groups[group].tonnage += row.set.weightKg * row.set.reps;
    }

    return Object.entries(groups)
      .map(([muscleGroup, data]) => ({
        muscleGroup,
        setsCount: data.setsCount,
        tonnage: Math.round(data.tonnage),
      }))
      .sort((a, b) => b.setsCount - a.setsCount);
  },

  /**
   * Retorna a evolução histórica de um exercício para desenhar linha do tempo e progressão
   */
  getExerciseProgression(exerciseId: string): ExerciseProgressionPoint[] {
    const sets = db
      .select()
      .from(sessionSets)
      .where(eq(sessionSets.exerciseId, exerciseId))
      .orderBy(sessionSets.completedAt)
      .all()
      .filter((s) => s.type === 'working');

    return sets.map((s) => ({
      date: new Date(s.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      timestamp: s.completedAt,
      weightKg: s.weightKg,
      reps: s.reps,
      estimated1RM: calculateOneRepMax(s.weightKg, s.reps),
    }));
  },

  /**
   * Retorna o volume total semanal das últimas 4 semanas
   */
  getWeeklyTrend(weeks: number = 4): WeeklyTrendItem[] {
    const now = new Date();
    const result: WeeklyTrendItem[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const sessions = db
        .select()
        .from(workoutSessions)
        .where(gte(workoutSessions.startedAt, start.getTime()))
        .all()
        .filter((s) => s.startedAt < end.getTime());

      const sets = db
        .select()
        .from(sessionSets)
        .where(gte(sessionSets.completedAt, start.getTime()))
        .all()
        .filter((s) => s.completedAt < end.getTime());

      const tonnage = sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);

      result.push({
        weekLabel: i === 0 ? 'Atual' : `Sem -${i}`,
        workoutsCount: sessions.length,
        setsCount: sets.length,
        tonnage: Math.round(tonnage),
      });
    }

    return result;
  },
};
