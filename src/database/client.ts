import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('noctis.db');
export const db = drizzle(expoDb, { schema });

/**
 * Cria as tabelas se não existirem e insere os exercícios padrão
 */
export function initDatabase() {
  expoDb.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL,
      workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      rir INTEGER,
      completed_at INTEGER NOT NULL
    );
  `);

  // Seed inicial com exercícios clássicos se a tabela estiver vazia
  const countResult = expoDb.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  if (!countResult || countResult.count === 0) {
    const defaultExercises = [
      { id: 'ex_supino_reto', name: 'Supino Reto com Barra', muscleGroup: 'Peito' },
      { id: 'ex_supino_inclinado', name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito' },
      { id: 'ex_crucifixo', name: 'Crucifixo na Polia', muscleGroup: 'Peito' },
      { id: 'ex_puxada_alta', name: 'Puxada Alta na Barra', muscleGroup: 'Costas' },
      { id: 'ex_remada_curvada', name: 'Remada Curvada', muscleGroup: 'Costas' },
      { id: 'ex_remada_baixa', name: 'Remada Baixa no Triângulo', muscleGroup: 'Costas' },
      { id: 'ex_agachamento', name: 'Agachamento Livre', muscleGroup: 'Pernas' },
      { id: 'ex_leg_press', name: 'Leg Press 45°', muscleGroup: 'Pernas' },
      { id: 'ex_cadeira_extensora', name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
      { id: 'ex_mesa_flexora', name: 'Mesa Flexora', muscleGroup: 'Pernas' },
      { id: 'ex_desenvolvimento', name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros' },
      { id: 'ex_elevacao_lateral', name: 'Elevação Lateral', muscleGroup: 'Ombros' },
      { id: 'ex_rosca_direta', name: 'Rosca Direta com Barra', muscleGroup: 'Braços' },
      { id: 'ex_triceps_corda', name: 'Tríceps Corda na Polia', muscleGroup: 'Braços' },
      { id: 'ex_triceps_testa', name: 'Tríceps Testa com Barra W', muscleGroup: 'Braços' },
      { id: 'ex_abdominal', name: 'Abdominal Supra na Prancha', muscleGroup: 'Abdômen' },
    ];

    const now = Date.now();
    for (const ex of defaultExercises) {
      expoDb.runSync(
        'INSERT INTO exercises (id, name, muscle_group, created_at) VALUES (?, ?, ?, ?)',
        [ex.id, ex.name, ex.muscleGroup, now]
      );
    }
  }
}
