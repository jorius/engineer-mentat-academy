// packages
import initSqlJs from 'sql.js';
import type { SqlJsStatic } from 'sql.js';

let instance: Promise<SqlJsStatic> | null = null;

export function loadSqlInNode(): Promise<SqlJsStatic> {
  if (instance === null) {
    instance = initSqlJs();
  }
  return instance;
}
