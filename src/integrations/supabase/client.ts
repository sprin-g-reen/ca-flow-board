// Temporary compatibility layer for Supabase migration
// This provides stub implementations to prevent build errors

interface QueryResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

interface QueryBuilder<T = unknown> {
  select: (query?: string) => QueryBuilder<T>;
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => QueryBuilder<T>;
  update: (data: Record<string, unknown>) => QueryBuilder<T>;
  delete: () => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  single: () => QueryBuilder<T>;
  then: (callback: (result: QueryResult<T>) => void) => void;
}

const createQueryBuilder = <T = unknown>(values?: Record<string, unknown>): QueryBuilder<T> => ({
  select: (query?: string) => createQueryBuilder<T>(),
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => createQueryBuilder<T>(),
  update: (data: Record<string, unknown>) => createQueryBuilder<T>(),
  delete: () => createQueryBuilder<T>(),
  eq: (column: string, value: unknown) => createQueryBuilder<T>(),
  order: (column: string, options?: { ascending?: boolean }) => createQueryBuilder<T>(),
  single: () => createQueryBuilder<T>(),
  then: (callback: (result: QueryResult<T>) => void) => callback({ data: null, error: null })
});

export const supabase = {
  from: (table: string) => createQueryBuilder(),
  channel: (name: string) => ({
    on: (event: string, config: any, callback: Function) => ({
      subscribe: (callback?: Function) => {}
    })
  }),
  removeChannel: (channel: any) => {}
};