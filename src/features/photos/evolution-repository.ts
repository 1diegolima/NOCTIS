import { desc, eq } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  evolutionEntries,
  evolutionPhotos,
  type EvolutionEntry,
  type NewEvolutionEntry,
  type EvolutionPhoto,
  type NewEvolutionPhoto,
} from '@/database/schema';

export interface FullEvolutionEntry extends EvolutionEntry {
  photos: EvolutionPhoto[];
}

export const evolutionRepository = {
  /**
   * Retorna todos os registros mensais ordenados do mais recente para o mais antigo
   */
  getAll(): FullEvolutionEntry[] {
    const entries = db
      .select()
      .from(evolutionEntries)
      .orderBy(desc(evolutionEntries.year), desc(evolutionEntries.month))
      .all();

    const allPhotos = db
      .select()
      .from(evolutionPhotos)
      .orderBy(desc(evolutionPhotos.createdAt))
      .all();

    return entries.map((entry) => ({
      ...entry,
      photos: allPhotos.filter((p) => p.entryId === entry.id),
    }));
  },

  /**
   * Retorna o registro de um mês específico
   */
  getByYearAndMonth(year: number, month: number): FullEvolutionEntry | null {
    const entry = db
      .select()
      .from(evolutionEntries)
      .where(eq(evolutionEntries.id, `${year}-${String(month).padStart(2, '0')}`))
      .get();

    if (!entry) return null;

    const photos = db
      .select()
      .from(evolutionPhotos)
      .where(eq(evolutionPhotos.entryId, entry.id))
      .orderBy(desc(evolutionPhotos.createdAt))
      .all();

    return {
      ...entry,
      photos,
    };
  },

  /**
   * Salva ou atualiza a entrada do mês
   */
  saveEntry(entry: {
    id: string;
    year: number;
    month: number;
    coverPhotoUri: string;
    weightKg?: number | null;
    bodyFat?: number | null;
    notes?: string | null;
    createdAt?: number;
  }): EvolutionEntry {
    const existing = db
      .select()
      .from(evolutionEntries)
      .where(eq(evolutionEntries.id, entry.id))
      .get();

    if (existing) {
      db.update(evolutionEntries)
        .set({
          coverPhotoUri: entry.coverPhotoUri,
          weightKg: entry.weightKg ?? null,
          bodyFat: entry.bodyFat ?? null,
          notes: entry.notes ?? null,
        })
        .where(eq(evolutionEntries.id, entry.id))
        .run();
      return {
        ...existing,
        coverPhotoUri: entry.coverPhotoUri,
        weightKg: entry.weightKg ?? null,
        bodyFat: entry.bodyFat ?? null,
        notes: entry.notes ?? null,
      };
    }

    const newRecord: NewEvolutionEntry = {
      id: entry.id,
      year: entry.year,
      month: entry.month,
      coverPhotoUri: entry.coverPhotoUri,
      weightKg: entry.weightKg ?? null,
      bodyFat: entry.bodyFat ?? null,
      notes: entry.notes ?? null,
      createdAt: entry.createdAt ?? Date.now(),
    };

    db.insert(evolutionEntries).values(newRecord).run();
    return newRecord as EvolutionEntry;
  },

  /**
   * Adiciona uma foto secundária (costas, lado, etc.) ao mês
   */
  addPhoto(photo: { entryId: string; photoUri: string; pose: string }): EvolutionPhoto {
    const newPhoto: NewEvolutionPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entryId: photo.entryId,
      photoUri: photo.photoUri,
      pose: photo.pose,
      createdAt: Date.now(),
    };
    db.insert(evolutionPhotos).values(newPhoto).run();
    return newPhoto as EvolutionPhoto;
  },

  /**
   * Deleta uma foto secundária
   */
  deletePhoto(photoId: string): void {
    db.delete(evolutionPhotos).where(eq(evolutionPhotos.id, photoId)).run();
  },

  /**
   * Deleta um mês inteiro de evolução
   */
  deleteEntry(entryId: string): void {
    db.delete(evolutionEntries).where(eq(evolutionEntries.id, entryId)).run();
  },
};
