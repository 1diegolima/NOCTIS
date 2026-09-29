import { db } from '@/database/client';
import {
  evolutionEntries,
  evolutionPhotos,
  exercises,
  routineExercises,
  routines,
  routineWorkouts,
  sessionSets,
  workoutSessions,
} from '@/database/schema';

export interface BackupPayload {
  version: number;
  exportedAt: number;
  data: {
    exercises: any[];
    routines: any[];
    routineWorkouts: any[];
    routineExercises: any[];
    workoutSessions: any[];
    sessionSets: any[];
    evolutionEntries: any[];
    evolutionPhotos: any[];
  };
}

export const backupService = {
  /**
   * Exporta todos os dados do NOCTIS em formato JSON estruturado
   */
  exportAllDataAsJson(): string {
    const allExercises = db.select().from(exercises).all();
    const allRoutines = db.select().from(routines).all();
    const allRoutineWorkouts = db.select().from(routineWorkouts).all();
    const allRoutineExercises = db.select().from(routineExercises).all();
    const allWorkoutSessions = db.select().from(workoutSessions).all();
    const allSessionSets = db.select().from(sessionSets).all();
    const allEvolutionEntries = db.select().from(evolutionEntries).all();
    const allEvolutionPhotos = db.select().from(evolutionPhotos).all();

    const payload: BackupPayload = {
      version: 1,
      exportedAt: Date.now(),
      data: {
        exercises: allExercises,
        routines: allRoutines,
        routineWorkouts: allRoutineWorkouts,
        routineExercises: allRoutineExercises,
        workoutSessions: allWorkoutSessions,
        sessionSets: allSessionSets,
        evolutionEntries: allEvolutionEntries,
        evolutionPhotos: allEvolutionPhotos,
      },
    };

    return JSON.stringify(payload, null, 2);
  },

  /**
   * Importa e restaura os dados de backup a partir de JSON
   */
  importDataFromJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed: BackupPayload = JSON.parse(jsonStr);

      if (!parsed || !parsed.data) {
        return { success: false, message: 'Arquivo de backup inválido.' };
      }

      const { data } = parsed;

      // Inserir com REPLACE para atualizar ou adicionar
      if (Array.isArray(data.routines)) {
        for (const r of data.routines) {
          db.insert(routines).values(r).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.routineWorkouts)) {
        for (const rw of data.routineWorkouts) {
          db.insert(routineWorkouts).values(rw).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.routineExercises)) {
        for (const re of data.routineExercises) {
          db.insert(routineExercises).values(re).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.workoutSessions)) {
        for (const ws of data.workoutSessions) {
          db.insert(workoutSessions).values(ws).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.sessionSets)) {
        for (const ss of data.sessionSets) {
          db.insert(sessionSets).values(ss).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.evolutionEntries)) {
        for (const ee of data.evolutionEntries) {
          db.insert(evolutionEntries).values(ee).onConflictDoNothing().run();
        }
      }

      if (Array.isArray(data.evolutionPhotos)) {
        for (const ep of data.evolutionPhotos) {
          db.insert(evolutionPhotos).values(ep).onConflictDoNothing().run();
        }
      }

      return {
        success: true,
        message: 'Backup restaurado com sucesso no banco de dados!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Erro ao processar backup: ${e.message || 'formato JSON inválido'}`,
      };
    }
  },

  /**
   * Exporta o histórico de treinos em formato CSV
   */
  exportWorkoutsAsCsv(): string {
    const sessions = db.select().from(workoutSessions).all();
    const sets = db.select().from(sessionSets).all();
    const exList = db.select().from(exercises).all();

    const exMap = new Map<string, string>();
    for (const ex of exList) {
      exMap.set(ex.id, ex.name);
    }

    const sessionMap = new Map<string, typeof sessions[0]>();
    for (const s of sessions) {
      sessionMap.set(s.id, s);
    }

    const headers = ['Data', 'Treino', 'Exercicio', 'Tipo_Serie', 'Serie_Num', 'Carga_Kg', 'Repeticoes'];
    const rows: string[] = [headers.join(',')];

    for (const set of sets) {
      const sess = sessionMap.get(set.sessionId);
      const dateStr = sess ? new Date(sess.startedAt).toISOString().split('T')[0] : '';
      const sessName = sess ? `"${sess.name.replace(/"/g, '""')}"` : '';
      const exName = `"${(exMap.get(set.exerciseId) || set.exerciseId).replace(/"/g, '""')}"`;

      rows.push([
        dateStr,
        sessName,
        exName,
        set.type,
        set.setNumber,
        set.weightKg,
        set.reps,
      ].join(','));
    }

    return rows.join('\n');
  },
};
