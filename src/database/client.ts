import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('noctis.db');
export const db = drizzle(expoDb, { schema });

/**
 * Cria todas as tabelas e popula a biblioteca completa de exercícios
 */
export function initDatabase() {
  expoDb.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      secondary_muscles TEXT,
      category TEXT NOT NULL DEFAULT 'composto',
      equipment TEXT NOT NULL DEFAULT 'barra',
      movement_pattern TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      split_type TEXT NOT NULL DEFAULT 'ppl_ul',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_workouts (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      routine_workout_id TEXT NOT NULL REFERENCES routine_workouts(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      order_index INTEGER NOT NULL,
      working_sets INTEGER NOT NULL DEFAULT 2,
      reps_min INTEGER NOT NULL DEFAULT 6,
      reps_max INTEGER NOT NULL DEFAULT 10,
      working_weight_kg REAL NOT NULL DEFAULT 0,
      rest_seconds INTEGER NOT NULL DEFAULT 120
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      routine_workout_id TEXT REFERENCES routine_workouts(id),
      name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      type TEXT NOT NULL DEFAULT 'working',
      set_number INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 1,
      completed_at INTEGER NOT NULL
    );
  `);

  // Seed da Biblioteca Completa de Exercícios
  const countResult = expoDb.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  if (!countResult || countResult.count === 0) {
    const defaultExercises = [
      // PEITO
      { id: 'ex_supino_reto', name: 'Supino Reto com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
      { id: 'ex_supino_inclinado_halter', name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
      { id: 'ex_supino_declinado', name: 'Supino Declinado com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
      { id: 'ex_chest_press_maquina', name: 'Chest Press na Máquina', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
      { id: 'ex_crucifixo_maquina', name: 'Crucifixo na Máquina (Peck Deck)', muscleGroup: 'Peito', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_crucifixo_polia', name: 'Crucifixo na Polia (Crossover)', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
      { id: 'ex_paralelas_peito', name: 'Paralelas (Foco Peitoral)', muscleGroup: 'Peito', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },

      // COSTAS
      { id: 'ex_barra_fixa', name: 'Barra Fixa (Pull-up)', muscleGroup: 'Costas', category: 'composto', equipment: 'peso_corporal', movementPattern: 'puxar' },
      { id: 'ex_puxada_frontal', name: 'Puxada Frontal na Polia', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
      { id: 'ex_remada_curvada', name: 'Remada Curvada com Barra', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'puxar' },
      { id: 'ex_remada_unilateral', name: 'Remada Unilateral com Halter (Serrote)', muscleGroup: 'Costas', category: 'composto', equipment: 'halter', movementPattern: 'puxar' },
      { id: 'ex_remada_maquina', name: 'Remada na Máquina', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
      { id: 'ex_remada_baixa_triangulo', name: 'Remada Baixa no Triângulo', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
      { id: 'ex_pulldown_corda', name: 'Pulldown com Corda na Polia', muscleGroup: 'Costas', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
      { id: 'ex_pullover', name: 'Pullover com Halter', muscleGroup: 'Costas', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },

      // OMBROS
      { id: 'ex_desenvolvimento_barra', name: 'Desenvolvimento Militar com Barra', muscleGroup: 'Ombros', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
      { id: 'ex_desenvolvimento_halteres', name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
      { id: 'ex_desenvolvimento_maquina', name: 'Desenvolvimento na Máquina', muscleGroup: 'Ombros', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
      { id: 'ex_elevacao_lateral_halteres', name: 'Elevação Lateral com Halteres', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
      { id: 'ex_elevacao_lateral_polia', name: 'Elevação Lateral na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
      { id: 'ex_elevacao_posterior', name: 'Elevação Posterior (Crucifixo Invertido)', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
      { id: 'ex_face_pull', name: 'Face Pull na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },

      // BÍCEPS
      { id: 'ex_rosca_direta_barra', name: 'Rosca Direta com Barra W', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
      { id: 'ex_rosca_alternada', name: 'Rosca Alternada com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
      { id: 'ex_rosca_martelo', name: 'Rosca Martelo com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
      { id: 'ex_rosca_scott', name: 'Rosca Scott na Máquina / Barra', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'maquina', movementPattern: 'puxar' },
      { id: 'ex_rosca_polia', name: 'Rosca Bíceps na Polia Baixa', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },

      // TRÍCEPS
      { id: 'ex_triceps_corda', name: 'Tríceps Corda na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
      { id: 'ex_triceps_barra_reta', name: 'Tríceps Barra Reta na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
      { id: 'ex_triceps_testa', name: 'Tríceps Testa com Barra W', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'barra', movementPattern: 'empurrar' },
      { id: 'ex_triceps_frances', name: 'Tríceps Francês com Halter', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'halter', movementPattern: 'empurrar' },
      { id: 'ex_paralelas_triceps', name: 'Paralelas (Foco Tríceps)', muscleGroup: 'Tríceps', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },

      // QUADRÍCEPS
      { id: 'ex_agachamento_livre', name: 'Agachamento Livre com Barra', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'barra', movementPattern: 'agachar' },
      { id: 'ex_leg_press_45', name: 'Leg Press 45°', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
      { id: 'ex_hack_squat', name: 'Hack Squat na Máquina', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
      { id: 'ex_cadeira_extensora', name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_agachamento_bulgaro', name: 'Agachamento Búlgaro com Halteres', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },

      // POSTERIORES DE COXA
      { id: 'ex_stiff', name: 'Stiff com Barra', muscleGroup: 'Posteriores', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
      { id: 'ex_rdl', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Posteriores', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
      { id: 'ex_mesa_flexora', name: 'Mesa Flexora Deitada', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_cadeira_flexora', name: 'Cadeira Flexora Sentada', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },

      // GLÚTEOS
      { id: 'ex_hip_thrust', name: 'Elevação Pélvica (Hip Thrust) com Barra', muscleGroup: 'Glúteos', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
      { id: 'ex_cadeira_abdutora', name: 'Cadeira Abdutora', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_afundo', name: 'Afundo com Halteres', muscleGroup: 'Glúteos', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },

      // PANTURRILHAS
      { id: 'ex_panturrilha_pe', name: 'Panturrilha em Pé na Máquina', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_panturrilha_sentado', name: 'Panturrilha Sentado (Gêmeos)', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
      { id: 'ex_panturrilha_leg_press', name: 'Panturrilha no Leg Press', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },

      // ABDÔMEN & CORE
      { id: 'ex_crunch_chao', name: 'Abdominal Crunch no Solo', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
      { id: 'ex_abdominal_polia', name: 'Abdominal na Polia Alta (Cable Crunch)', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
      { id: 'ex_elevacao_pernas', name: 'Elevação de Pernas na Barra Fixa', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
      { id: 'ex_prancha', name: 'Prancha Isométrica', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
      { id: 'ex_ab_wheel', name: 'Roda Abdominal (Ab Wheel)', muscleGroup: 'Abdômen', category: 'composto', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    ];

    const now = Date.now();
    for (const ex of defaultExercises) {
      expoDb.runSync(
        'INSERT INTO exercises (id, name, muscle_group, secondary_muscles, category, equipment, movement_pattern, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ex.id, ex.name, ex.muscleGroup, null, ex.category, ex.equipment, ex.movementPattern, now]
      );
    }
  }

  // Seed de uma rotina PPL/UL inicial padrão se nenhuma rotina existir
  const routineCount = expoDb.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM routines');
  if (!routineCount || routineCount.count === 0) {
    const routineId = 'routine_ppl_ul_default';
    const now = Date.now();

    expoDb.runSync(
      'INSERT INTO routines (id, name, split_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
      [routineId, 'Divisão PPL/UL (5 Dias)', 'ppl_ul', 1, now]
    );

    const workoutsData = [
      { id: 'rw_push', name: 'Push (Peito, Ombro e Tríceps)', order: 1 },
      { id: 'rw_pull', name: 'Pull (Costas e Bíceps)', order: 2 },
      { id: 'rw_legs', name: 'Legs (Pernas Completo)', order: 3 },
      { id: 'rw_upper', name: 'Upper (Superior Completo)', order: 4 },
      { id: 'rw_lower', name: 'Lower (Inferior Completo)', order: 5 },
    ];

    for (const rw of workoutsData) {
      expoDb.runSync(
        'INSERT INTO routine_workouts (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)',
        [rw.id, routineId, rw.name, rw.order]
      );
    }

    // Adiciona alguns exercícios de exemplo no Push inicial
    const pushExercises = [
      { id: 're_1', rwId: 'rw_push', exId: 'ex_supino_reto', order: 1, sets: 2, rMin: 6, rMax: 10, weight: 90 },
      { id: 're_2', rwId: 'rw_push', exId: 'ex_supino_inclinado_halter', order: 2, sets: 2, rMin: 8, rMax: 12, weight: 32 },
      { id: 're_3', rwId: 'rw_push', exId: 'ex_crucifixo_polia', order: 3, sets: 2, rMin: 10, rMax: 15, weight: 20 },
      { id: 're_4', rwId: 'rw_push', exId: 'ex_desenvolvimento_halteres', order: 4, sets: 2, rMin: 6, rMax: 10, weight: 26 },
      { id: 're_5', rwId: 'rw_push', exId: 'ex_elevacao_lateral_polia', order: 5, sets: 3, rMin: 10, rMax: 15, weight: 12 },
      { id: 're_6', rwId: 'rw_push', exId: 'ex_triceps_corda', order: 6, sets: 2, rMin: 8, rMax: 12, weight: 35 },
    ];

    for (const re of pushExercises) {
      expoDb.runSync(
        'INSERT INTO routine_exercises (id, routine_workout_id, exercise_id, order_index, working_sets, reps_min, reps_max, working_weight_kg, rest_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [re.id, re.rwId, re.exId, re.order, re.sets, re.rMin, re.rMax, re.weight, 120]
      );
    }
  }
}
