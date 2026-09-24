// packages
import type { SqlJsStatic } from 'sql.js';

export async function loadSqlInBrowser(): Promise<SqlJsStatic> {
  const [{ default: initSqlJs }, { default: wasmUrl }] = await Promise.all([
    import('sql.js'),
    import('sql.js/dist/sql-wasm.wasm?url'),
  ]);
  return initSqlJs({ locateFile: (): string => wasmUrl });
}
