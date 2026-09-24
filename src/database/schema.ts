import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export type MuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Quadríceps'
  | 'Posteriores'
  | 'Glúteos'
  | 'Panturrilhas'
  | 'Abdômen';

export type ExerciseCategory = 'composto' | 'isolador';
export type EquipmentType = 'barra' | 'halter' | 'cabo' | 'maquina' | 'peso_corporal';
export type SplitType = 'ppl_ul' | 'ppl' | 'upper_lower' | 'full_body' | 'custom';
export type SetType = 'warmup' | 'feeder' | 'working';

// ==========================================
// 1. BANCO DE EXERCÍCIOS COM METADADOS
// ==========================================
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  secondaryMuscles: text('secondary_muscles'), // JSON string ex: '["Tríceps", "Ombros"]'
  category: text('category').notNull().default('composto'), // 'composto' | 'isolador'
  equipment: text('equipment').notNull().default('barra'), // 'barra' | 'halter' | 'cabo' | 'maquina' | 'peso_corporal'
  movementPattern: text('movement_pattern'), // 'empurrar' | 'puxar' | 'agachar' | 'dobradiça' | 'isolamento'
  createdAt: integer('created_at').notNull(),
});

// ==========================================
// 2. PROGRAMAS E DIVISÕES DE TREINO (SPLITS)
// ==========================================
export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  splitType: text('split_type').notNull().default('ppl_ul'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
});

// Sessões dentro da divisão (ex: Push, Pull, Legs, Upper, Lower)
export const routineWorkouts = sqliteTable('routine_workouts', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
});

// Exercícios configurados dentro de cada sessão
export const routineExercises = sqliteTable('routine_exercises', {
  id: text('id').primaryKey(),
  routineWorkoutId: text('routine_workout_id').notNull().references(() => routineWorkouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  orderIndex: integer('order_index').notNull(),
  workingSets: integer('working_sets').notNull().default(2),
  repsMin: integer('reps_min').notNull().default(6),
  repsMax: integer('reps_max').notNull().default(10),
  workingWeightKg: real('working_weight_kg').notNull().default(0),
  restSeconds: integer('rest_seconds').notNull().default(120),
});

// ==========================================
// 3. SESSÕES EXECUTADAS E SÉRIES (HISTÓRICO)
// ==========================================
export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  routineWorkoutId: text('routine_workout_id').references(() => routineWorkouts.id),
  name: text('name').notNull(),
  startedAt: integer('started_at').notNull(),
  completedAt: integer('completed_at'),
  notes: text('notes'),
});

export const sessionSets = sqliteTable('session_sets', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  type: text('type').notNull().default('working'), // 'warmup' | 'feeder' | 'working'
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  isCompleted: integer('is_completed').notNull().default(1),
  completedAt: integer('completed_at').notNull(),
});

// Infer Types
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;

export type RoutineWorkout = typeof routineWorkouts.$inferSelect;
export type NewRoutineWorkout = typeof routineWorkouts.$inferInsert;

export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;

export type SessionSet = typeof sessionSets.$inferSelect;
export type NewSessionSet = typeof sessionSets.$inferInsert;
