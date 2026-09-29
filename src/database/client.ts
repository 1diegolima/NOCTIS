import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('noctis.db');
export const db = drizzle(expoDb, { schema });

/**
 * Cria todas as tabelas com migração segura e popula a biblioteca completa de exercícios
 */
export function initDatabase() {
  // Criação das tabelas
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

    CREATE TABLE IF NOT EXISTS evolution_entries (
      id TEXT PRIMARY KEY NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      cover_photo_uri TEXT NOT NULL,
      weight_kg REAL,
      body_fat REAL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evolution_photos (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES evolution_entries(id) ON DELETE CASCADE,
      photo_uri TEXT NOT NULL,
      pose TEXT NOT NULL DEFAULT 'outro',
      created_at INTEGER NOT NULL
    );
  `);

  // Migração segura para tabelas já existentes: adiciona colunas se faltarem
  try {
    expoDb.execSync(`
      ALTER TABLE exercises ADD COLUMN secondary_muscles TEXT;
    `);
  } catch {}

  try {
    expoDb.execSync(`
      ALTER TABLE exercises ADD COLUMN category TEXT NOT NULL DEFAULT 'composto';
    `);
  } catch {}

  try {
    expoDb.execSync(`
      ALTER TABLE exercises ADD COLUMN equipment TEXT NOT NULL DEFAULT 'barra';
    `);
  } catch {}

  try {
    expoDb.execSync(`
      ALTER TABLE exercises ADD COLUMN movement_pattern TEXT;
    `);
  } catch {}

  // Seed da Biblioteca Completa e Abrangente de Exercícios
  const defaultExercises = [
    // ==========================================
    // 🟥 PEITO (CHEST)
    // ==========================================
    { id: 'ex_supino_reto', name: 'Supino Reto com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_supino_reto_halter', name: 'Supino Reto com Halteres', muscleGroup: 'Peito', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_supino_reto_maquina', name: 'Supino Reto na Máquina', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_supino_convergente', name: 'Supino Convergente', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_supino_inclinado_barra', name: 'Supino Inclinado com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_supino_inclinado_halter', name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_supino_inclinado_maquina', name: 'Supino Inclinado na Máquina', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_supino_inclinado_convergente', name: 'Supino Inclinado Convergente', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_supino_declinado', name: 'Supino Declinado com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_supino_declinado_halter', name: 'Supino Declinado com Halteres', muscleGroup: 'Peito', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_supino_declinado_maquina', name: 'Supino Declinado na Máquina', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_chest_press_maquina', name: 'Chest Press na Máquina', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_chest_press_unilateral', name: 'Chest Press Unilateral', muscleGroup: 'Peito', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_crucifixo_reto_halter', name: 'Crucifixo Reto com Halteres', muscleGroup: 'Peito', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_inclinado_halter', name: 'Crucifixo Inclinado com Halteres', muscleGroup: 'Peito', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_declinado_halter', name: 'Crucifixo Declinado com Halteres', muscleGroup: 'Peito', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_maquina', name: 'Crucifixo na Máquina (Peck Deck)', muscleGroup: 'Peito', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_inclinado_maquina', name: 'Crucifixo Inclinado na Máquina', muscleGroup: 'Peito', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_unilateral_maquina', name: 'Crucifixo Unilateral na Máquina', muscleGroup: 'Peito', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_polia', name: 'Crucifixo na Polia (Crossover)', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_polia_baixa', name: 'Crucifixo na Polia Baixa', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_polia_alta', name: 'Crossover na Polia Alta', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_polia_media', name: 'Crossover na Polia Média', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_polia_baixa', name: 'Crossover na Polia Baixa', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_unilateral', name: 'Crossover Unilateral na Polia', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_baixo_cima', name: 'Crossover de Baixo para Cima', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crossover_cima_baixo', name: 'Crossover de Cima para Baixo', muscleGroup: 'Peito', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_flexao_solo', name: 'Flexão de Braço no Solo', muscleGroup: 'Peito', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_flexao_declinada', name: 'Flexão de Braço Declinada', muscleGroup: 'Peito', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_flexao_inclinada', name: 'Flexão de Braço Inclinada', muscleGroup: 'Peito', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_paralelas_peito', name: 'Paralelas (Foco Peitoral)', muscleGroup: 'Peito', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_pullover_peito_halter', name: 'Pullover com Halter (Foco Peito)', muscleGroup: 'Peito', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_floor_press_halter', name: 'Floor Press com Halteres', muscleGroup: 'Peito', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_floor_press_barra', name: 'Floor Press com Barra', muscleGroup: 'Peito', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },

    // ==========================================
    // 🟦 COSTAS (BACK)
    // ==========================================
    { id: 'ex_barra_fixa', name: 'Barra Fixa (Pull-up)', muscleGroup: 'Costas', category: 'composto', equipment: 'peso_corporal', movementPattern: 'puxar' },
    { id: 'ex_chin_up', name: 'Barra Fixa Supinada (Chin-up)', muscleGroup: 'Costas', category: 'composto', equipment: 'peso_corporal', movementPattern: 'puxar' },
    { id: 'ex_barra_fixa_neutra', name: 'Barra Fixa com Pegada Neutra', muscleGroup: 'Costas', category: 'composto', equipment: 'peso_corporal', movementPattern: 'puxar' },
    { id: 'ex_barra_fixa_graviton', name: 'Barra Fixa no Graviton', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_puxada_frontal', name: 'Puxada Frontal na Polia', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_puxada_triangulo', name: 'Puxada Frontal com Triângulo', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_puxada_supinada', name: 'Puxada com Pegada Supinada', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_puxada_articulada', name: 'Puxada Articulada na Máquina', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_puxada_unilateral', name: 'Puxada Unilateral na Polia', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_curvada', name: 'Remada Curvada com Barra', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_remada_curvada_supinada', name: 'Remada Curvada Supinada (Yates)', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_remada_curvada_halter', name: 'Remada Curvada com Halteres', muscleGroup: 'Costas', category: 'composto', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_remada_cavalinho', name: 'Remada Cavalinho com Barra (T-Bar)', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_remada_cavalinho_maquina', name: 'Remada Cavalinho na Máquina', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_remada_unilateral', name: 'Remada Unilateral com Halter (Serrote)', muscleGroup: 'Costas', category: 'composto', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_remada_maquina', name: 'Remada na Máquina Pegada Neutra', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_remada_maquina_pronada', name: 'Remada na Máquina Pegada Pronada', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_remada_maquina_unilateral', name: 'Remada na Máquina Unilateral', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_remada_baixa_triangulo', name: 'Remada Baixa no Triângulo', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_baixa_barra_reta', name: 'Remada Baixa com Barra Reta', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_baixa_unilateral', name: 'Remada Baixa Unilateral na Polia', muscleGroup: 'Costas', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_convergente', name: 'Remada Articulada Convergente', muscleGroup: 'Costas', category: 'composto', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_pulldown_corda', name: 'Pulldown com Corda na Polia', muscleGroup: 'Costas', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_pulldown_barra', name: 'Pulldown com Barra Reta na Polia', muscleGroup: 'Costas', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_pullover', name: 'Pullover com Halter', muscleGroup: 'Costas', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_pullover_polia', name: 'Pullover na Polia', muscleGroup: 'Costas', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_pullover_maquina', name: 'Pullover na Máquina', muscleGroup: 'Costas', category: 'isolador', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_terra_convencional', name: 'Levantamento Terra Convencional', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_terra_sumo', name: 'Levantamento Terra Sumô', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_rack_pull', name: 'Rack Pull com Barra', muscleGroup: 'Costas', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_hiperextensao_lombar', name: 'Hiperextensão Lombar (Banco Romano)', muscleGroup: 'Costas', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'dobradiça' },
    { id: 'ex_encolhimento_halter', name: 'Encolhimento de Ombros com Halteres', muscleGroup: 'Costas', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_encolhimento_barra', name: 'Encolhimento de Ombros com Barra', muscleGroup: 'Costas', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_encolhimento_smith', name: 'Encolhimento de Ombros no Smith', muscleGroup: 'Costas', category: 'isolador', equipment: 'maquina', movementPattern: 'puxar' },

    // ==========================================
    // 🟨 OMBROS (SHOULDERS)
    // ==========================================
    { id: 'ex_desenvolvimento_barra', name: 'Desenvolvimento Militar com Barra', muscleGroup: 'Ombros', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_barra_sentado', name: 'Desenvolvimento com Barra Sentado', muscleGroup: 'Ombros', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_halteres', name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_arnold', name: 'Desenvolvimento Arnold com Halteres', muscleGroup: 'Ombros', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_maquina', name: 'Desenvolvimento na Máquina', muscleGroup: 'Ombros', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_smith', name: 'Desenvolvimento no Smith', muscleGroup: 'Ombros', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_desenvolvimento_unilateral', name: 'Desenvolvimento Unilateral com Halter', muscleGroup: 'Ombros', category: 'composto', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_elevacao_lateral_halteres', name: 'Elevação Lateral com Halteres', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_lateral_polia', name: 'Elevação Lateral na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_lateral_polia_unilateral', name: 'Elevação Lateral Unilateral na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_lateral_maquina', name: 'Elevação Lateral na Máquina', muscleGroup: 'Ombros', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_lateral_banco_inclinado', name: 'Elevação Lateral no Banco Inclinado', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_lateral_sentado', name: 'Elevação Lateral Sentado com Halteres', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_frontal_halter', name: 'Elevação Frontal com Halteres', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_frontal_barra', name: 'Elevação Frontal com Barra', muscleGroup: 'Ombros', category: 'isolador', equipment: 'barra', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_frontal_polia', name: 'Elevação Frontal na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_frontal_anilha', name: 'Elevação Frontal com Anilha', muscleGroup: 'Ombros', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_posterior', name: 'Elevação Posterior (Crucifixo Invertido)', muscleGroup: 'Ombros', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_invertido_maquina', name: 'Crucifixo Invertido na Máquina (Peck Deck Invertido)', muscleGroup: 'Ombros', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_invertido_polia', name: 'Crucifixo Invertido na Polia (Cabo Cruzado)', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_crucifixo_invertido_unilateral', name: 'Crucifixo Invertido Unilateral no Cabo', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_face_pull', name: 'Face Pull na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_alta_barra', name: 'Remada Alta com Barra', muscleGroup: 'Ombros', category: 'composto', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_remada_alta_polia', name: 'Remada Alta na Polia', muscleGroup: 'Ombros', category: 'composto', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_remada_alta_halter', name: 'Remada Alta com Halteres', muscleGroup: 'Ombros', category: 'composto', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_manguito_rotador_externo', name: 'Manguito Rotador Externo na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_manguito_rotador_interno', name: 'Manguito Rotador Interno na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_y_raise_polia', name: 'Y-Raise na Polia', muscleGroup: 'Ombros', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },

    // ==========================================
    // 🟩 BÍCEPS E ANTEBRAÇO
    // ==========================================
    { id: 'ex_rosca_direta_barra_reta', name: 'Rosca Direta com Barra Reta', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_rosca_direta_barra', name: 'Rosca Direta com Barra W', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_rosca_direta_halter', name: 'Rosca Direta Simultânea com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_alternada', name: 'Rosca Alternada com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_inclinada_banco', name: 'Rosca Alternada no Banco Inclinado 45°', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_martelo', name: 'Rosca Martelo com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_martelo_polia', name: 'Rosca Martelo com Corda na Polia', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_rosca_martelo_cruzada', name: 'Rosca Martelo Cruzada no Peito', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_scott', name: 'Rosca Scott com Barra W', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_rosca_scott_maquina', name: 'Rosca Scott na Máquina', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'maquina', movementPattern: 'puxar' },
    { id: 'ex_rosca_scott_halter', name: 'Rosca Scott Unilateral com Halter', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_concentrada', name: 'Rosca Concentrada com Halter', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_polia', name: 'Rosca Bíceps na Polia Baixa', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_rosca_duplo_biceps', name: 'Rosca Duplo Bíceps na Polia Alta', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_rosca_unilateral_polia', name: 'Rosca Bíceps Unilateral no Cabo', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_rosca_21', name: 'Rosca 21 com Barra W', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_rosca_spider', name: 'Rosca Spider no Banco 45°', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_zottman', name: 'Rosca Zottman com Halteres', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'halter', movementPattern: 'puxar' },
    { id: 'ex_rosca_inversa_barra', name: 'Rosca Inversa com Barra', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'puxar' },
    { id: 'ex_rosca_inversa_polia', name: 'Rosca Inversa na Polia', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'cabo', movementPattern: 'puxar' },
    { id: 'ex_flexao_punho_barra', name: 'Flexão de Punho com Barra (Antebraço)', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'isolamento' },
    { id: 'ex_extensao_punho_barra', name: 'Extensão de Punho com Barra (Antebraço)', muscleGroup: 'Bíceps', category: 'isolador', equipment: 'barra', movementPattern: 'isolamento' },

    // ==========================================
    // 🟧 TRÍCEPS
    // ==========================================
    { id: 'ex_triceps_corda', name: 'Tríceps Corda na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_barra_reta', name: 'Tríceps Barra Reta na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_barra_v', name: 'Tríceps Barra V na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_unilateral_polia', name: 'Tríceps Unilateral na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_invertido_polia', name: 'Tríceps Supinado (Invertido) na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_testa', name: 'Tríceps Testa com Barra W', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_triceps_testa_halter', name: 'Tríceps Testa com Halteres', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_triceps_testa_polia', name: 'Tríceps Testa na Polia Baixa', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_frances', name: 'Tríceps Francês com Halter', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_triceps_frances_unilateral', name: 'Tríceps Francês Unilateral com Halter', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_triceps_frances_polia', name: 'Tríceps Francês na Polia com Corda', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_coice_halter', name: 'Tríceps Coice (Kickback) com Halter', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'halter', movementPattern: 'empurrar' },
    { id: 'ex_triceps_coice_polia', name: 'Tríceps Coice na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },
    { id: 'ex_triceps_maquina', name: 'Tríceps na Máquina', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_triceps_banco', name: 'Mergulho no Banco (Dips)', muscleGroup: 'Tríceps', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_paralelas_triceps', name: 'Paralelas (Foco Tríceps)', muscleGroup: 'Tríceps', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_supino_fechado_barra', name: 'Supino Fechado com Barra', muscleGroup: 'Tríceps', category: 'composto', equipment: 'barra', movementPattern: 'empurrar' },
    { id: 'ex_supino_fechado_smith', name: 'Supino Fechado no Smith', muscleGroup: 'Tríceps', category: 'composto', equipment: 'maquina', movementPattern: 'empurrar' },
    { id: 'ex_flexao_diamante', name: 'Flexão Diamante no Solo', muscleGroup: 'Tríceps', category: 'composto', equipment: 'peso_corporal', movementPattern: 'empurrar' },
    { id: 'ex_katana_extension', name: 'Extensão Katana Overhead na Polia', muscleGroup: 'Tríceps', category: 'isolador', equipment: 'cabo', movementPattern: 'empurrar' },

    // ==========================================
    // 🟫 QUADRÍCEPS
    // ==========================================
    { id: 'ex_agachamento_livre', name: 'Agachamento Livre com Barra', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'barra', movementPattern: 'agachar' },
    { id: 'ex_agachamento_frontal', name: 'Agachamento Frontal com Barra', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'barra', movementPattern: 'agachar' },
    { id: 'ex_agachamento_smith', name: 'Agachamento no Smith', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_agachamento_sumo_halter', name: 'Agachamento Sumô com Halter', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },
    { id: 'ex_agachamento_goblet', name: 'Agachamento Goblet (Taça)', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },
    { id: 'ex_agachamento_bulgaro', name: 'Agachamento Búlgaro com Halteres', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },
    { id: 'ex_agachamento_bulgaro_smith', name: 'Agachamento Búlgaro no Smith', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_agachamento_sissy', name: 'Agachamento Sissy', muscleGroup: 'Quadríceps', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'agachar' },
    { id: 'ex_agachamento_zercher', name: 'Agachamento Zercher com Barra', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'barra', movementPattern: 'agachar' },
    { id: 'ex_hack_squat', name: 'Hack Squat na Máquina', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_hack_squat_invertido', name: 'Hack Squat Invertido', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_leg_press_45', name: 'Leg Press 45°', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_leg_press_horizontal', name: 'Leg Press Horizontal', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_leg_press_unilateral', name: 'Leg Press 45° Unilateral', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_cadeira_extensora', name: 'Cadeira Extensora', muscleGroup: 'Quadríceps', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_cadeira_extensora_unilateral', name: 'Cadeira Extensora Unilateral', muscleGroup: 'Quadríceps', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_avanco_halteres', name: 'Passada / Avanço com Halteres', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },
    { id: 'ex_afundo_smith', name: 'Afundo no Smith', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'maquina', movementPattern: 'agachar' },
    { id: 'ex_step_up_halter', name: 'Step-up no Banco com Halteres', muscleGroup: 'Quadríceps', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },

    // ==========================================
    // 🟪 POSTERIORES DE COXA
    // ==========================================
    { id: 'ex_stiff', name: 'Stiff com Barra', muscleGroup: 'Posteriores', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_stiff_halter', name: 'Stiff com Halteres', muscleGroup: 'Posteriores', category: 'composto', equipment: 'halter', movementPattern: 'dobradiça' },
    { id: 'ex_rdl', name: 'Romanian Deadlift (RDL) com Barra', muscleGroup: 'Posteriores', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_rdl_halter', name: 'Romanian Deadlift (RDL) com Halteres', muscleGroup: 'Posteriores', category: 'composto', equipment: 'halter', movementPattern: 'dobradiça' },
    { id: 'ex_rdl_unilateral_halter', name: 'RDL Unilateral (B-Stance) com Halteres', muscleGroup: 'Posteriores', category: 'composto', equipment: 'halter', movementPattern: 'dobradiça' },
    { id: 'ex_mesa_flexora', name: 'Mesa Flexora Deitada', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_mesa_flexora_unilateral', name: 'Mesa Flexora Unilateral', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_cadeira_flexora', name: 'Cadeira Flexora Sentada', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_cadeira_flexora_unilateral', name: 'Cadeira Flexora Unilateral', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_flexora_em_pe', name: 'Flexora em Pé Unilateral na Máquina', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_flexora_cabo', name: 'Flexora no Cabo com Tornozeleira', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_good_morning', name: 'Good Morning (Bom Dia) com Barra', muscleGroup: 'Posteriores', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_nordic_curl', name: 'Nordic Hamstring Curl (Flexão Nórdica)', muscleGroup: 'Posteriores', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_ghd_raise', name: 'Glute Ham Developer (GHD)', muscleGroup: 'Posteriores', category: 'composto', equipment: 'peso_corporal', movementPattern: 'dobradiça' },

    // ==========================================
    // 🍑 GLÚTEOS
    // ==========================================
    { id: 'ex_hip_thrust', name: 'Elevação Pélvica (Hip Thrust) com Barra', muscleGroup: 'Glúteos', category: 'composto', equipment: 'barra', movementPattern: 'dobradiça' },
    { id: 'ex_hip_thrust_maquina', name: 'Elevação Pélvica na Máquina', muscleGroup: 'Glúteos', category: 'composto', equipment: 'maquina', movementPattern: 'dobradiça' },
    { id: 'ex_hip_thrust_unilateral', name: 'Elevação Pélvica Unilateral', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'halter', movementPattern: 'dobradiça' },
    { id: 'ex_glute_bridge', name: 'Ponte de Glúteos no Solo (Glute Bridge)', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'dobradiça' },
    { id: 'ex_cadeira_abdutora', name: 'Cadeira Abdutora', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_cadeira_abdutora_inclinada', name: 'Cadeira Abdutora com Tronco Inclinado', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_gluteo_quatro_apoios', name: 'Glúteo 4 Apoios com Caneleira', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_gluteo_kickback_cabo', name: 'Glúteo Coice no Cabo (Kickback)', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_abducao_cabo', name: 'Abdução de Quadril no Cabo com Tornozeleira', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_afundo', name: 'Afundo Reverso com Halteres', muscleGroup: 'Glúteos', category: 'composto', equipment: 'halter', movementPattern: 'agachar' },
    { id: 'ex_frog_pump', name: 'Frog Pump com Halter', muscleGroup: 'Glúteos', category: 'isolador', equipment: 'halter', movementPattern: 'dobradiça' },

    // ==========================================
    // 🟦 PANTURRILHAS
    // ==========================================
    { id: 'ex_panturrilha_pe', name: 'Panturrilha em Pé na Máquina', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_pe_smith', name: 'Panturrilha em Pé no Smith', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_unilateral_halter', name: 'Panturrilha em Pé Unilateral com Halter', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'halter', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_degrau', name: 'Panturrilha no Degrau (Peso Corporal)', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_sentado', name: 'Panturrilha Sentado (Gêmeos)', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_leg_press', name: 'Panturrilha no Leg Press 45°', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_leg_horizontal', name: 'Panturrilha no Leg Press Horizontal', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_panturrilha_donkey', name: 'Panturrilha Donkey (Burrinho)', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_tibial_anterior', name: 'Elevação Tibial Anterior', muscleGroup: 'Panturrilhas', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },

    // ==========================================
    // 🟩 ABDÔMEN & CORE
    // ==========================================
    { id: 'ex_crunch_chao', name: 'Abdominal Crunch no Solo', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_crunch_maquina', name: 'Abdominal Crunch na Máquina', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'maquina', movementPattern: 'isolamento' },
    { id: 'ex_abdominal_polia', name: 'Abdominal na Polia Alta (Cable Crunch)', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_abdominal_declinado', name: 'Abdominal no Banco Declinado', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_pernas', name: 'Elevação de Pernas na Barra Fixa', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_pernas_paralela', name: 'Elevação de Pernas nas Paralelas', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_elevacao_pernas_solo', name: 'Elevação de Pernas no Solo', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_prancha', name: 'Prancha Isométrica', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_prancha_lateral', name: 'Prancha Lateral', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_ab_wheel', name: 'Roda Abdominal (Ab Wheel)', muscleGroup: 'Abdômen', category: 'composto', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_vacuum_abdominal', name: 'Stomach Vacuum', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_russian_twist', name: 'Russian Twist com Anilha', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_woodchopper_alto', name: 'Woodchopper na Polia Alta', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_woodchopper_baixo', name: 'Woodchopper na Polia Baixa', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'cabo', movementPattern: 'isolamento' },
    { id: 'ex_dead_bug', name: 'Dead Bug', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
    { id: 'ex_hollow_body', name: 'Hollow Body Hold (Canoa)', muscleGroup: 'Abdômen', category: 'isolador', equipment: 'peso_corporal', movementPattern: 'isolamento' },
  ];

  const now = Date.now();
  for (const ex of defaultExercises) {
    expoDb.runSync(
      'INSERT OR REPLACE INTO exercises (id, name, muscle_group, secondary_muscles, category, equipment, movement_pattern, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ex.id, ex.name, ex.muscleGroup, null, ex.category, ex.equipment, ex.movementPattern, now]
    );
  }

  // Garante que uma rotina PPL/UL exista
  const activeRoutine = expoDb.getFirstSync<{ id: string }>('SELECT id FROM routines WHERE is_active = 1');
  if (!activeRoutine) {
    const routineId = 'routine_ppl_ul_default';
    expoDb.runSync(
      'INSERT OR REPLACE INTO routines (id, name, split_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
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
        'INSERT OR REPLACE INTO routine_workouts (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)',
        [rw.id, routineId, rw.name, rw.order]
      );
    }

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
        'INSERT OR REPLACE INTO routine_exercises (id, routine_workout_id, exercise_id, order_index, working_sets, reps_min, reps_max, working_weight_kg, rest_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [re.id, re.rwId, re.exId, re.order, re.sets, re.rMin, re.rMax, re.weight, 120]
      );
    }
  }
}
