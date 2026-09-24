// packages
import type { SqlJsStatic } from 'sql.js';

export type SqlResult = { status: 'ok' | 'error'; columns: string[]; rows: unknown[][]; error?: string };
export type SqlLoader = () => Promise<SqlJsStatic>;
export type SqlRunner = (schema: string, query: string) => Promise<SqlResult>;

export function createSqlRunner(loader: SqlLoader): SqlRunner {
  let instance: Promise<SqlJsStatic> | null = null;

  return async (schema: string, query: string): Promise<SqlResult> => {
    if (instance === null) {
      instance = loader();
    }
    let SQL: SqlJsStatic;
    try {
      SQL = await instance;
    } catch (error) {
      instance = null;
      return { status: 'error', columns: [], rows: [], error: error instanceof Error ? error.message : String(error) };
    }
    const db = new SQL.Database();
    try {
      db.run(schema);
      const sets = db.exec(query);
      const first = sets[0];
      if (first === undefined) {
        return { status: 'ok', columns: [], rows: [] };
      }
      return { status: 'ok', columns: first.columns, rows: first.values };
    } catch (error) {
      return { status: 'error', columns: [], rows: [], error: error instanceof Error ? error.message : String(error) };
    } finally {
      db.close();
    }
  };
}
