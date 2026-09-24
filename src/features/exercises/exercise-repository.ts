import { db } from '@/database/client';
import { exercises, type Exercise, type NewExercise } from '@/database/schema';

export const exerciseRepository = {
  getAll(): Exercise[] {
    return db.select().from(exercises).all();
  },

  create(exercise: NewExercise): Exercise {
    db.insert(exercises).values(exercise).run();
    return exercise as Exercise;
  },
};
