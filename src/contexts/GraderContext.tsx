// packages
import { createContext, useContext, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';

// engine
import { createStaticGrader } from '../engine/staticGrader';
import { runJs } from '../engine/runner/runJs';
import { createSqlRunner } from '../engine/sql/runSql';
import { loadSqlInBrowser } from '../engine/sql/browserLoader';
import type { Grader } from '../engine/grader';

const GraderContext = createContext<Grader | null>(null);

export function GraderProvider({ children, grader }: { children: ReactNode; grader?: Grader }): JSX.Element {
  const value = useMemo((): Grader => grader ?? createStaticGrader({ runJs, runSql: createSqlRunner(loadSqlInBrowser) }), [grader]);
  return <GraderContext.Provider value={value}>{children}</GraderContext.Provider>;
}

export function useGrader(): Grader {
  const value = useContext(GraderContext);
  if (value === null) {
    throw new Error('useGrader must be used inside GraderProvider');
  }
  return value;
}
