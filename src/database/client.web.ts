// Mock client para ambiente Web (evita que o Metro Web tente carregar o worker.ts do SQLite que é exclusivo de nativo)
export const expoDb = {
  execSync: () => {},
  getFirstSync: () => ({ count: 1, id: 'routine_ppl_ul_default' }),
  getAllSync: () => [],
  runSync: () => {},
};

export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        get: () => null,
        all: () => [],
        orderBy: () => ({ all: () => [] }),
      }),
      orderBy: () => ({ all: () => [] }),
      all: () => [],
      get: () => null,
    }),
  }),
  insert: () => ({
    values: () => ({ run: () => {} }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({ run: () => {} }),
      run: () => {},
    }),
  }),
  delete: () => ({
    where: () => ({ run: () => {} }),
  }),
} as any;

export function initDatabase() {
  // No-op na web
}
