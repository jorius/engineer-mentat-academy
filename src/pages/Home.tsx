// packages
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { DOMAINS } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function Home(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const overall = summarize(list, progress);
  const missed = list.filter((q) => (progress[q.id]?.attempts ?? 0) > 0 && (progress[q.id]?.lastScore ?? 1) < 1).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Engineer Mentat Academy</h1>
        <p className="text-zinc-500">Train like a Mentat: {overall.total} questions, {overall.attempted} attempted, {missed} to revisit.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/drill?unseen=1" className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">Drill unseen</Link>
        <Link to="/mock" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">Mock interview</Link>
        <Link to="/review" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">Review missed ({missed})</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          return (
            <Card key={domain.id} className="space-y-1">
              <Link to={`/browse/${domain.id}`} className="font-medium underline">{domain.name}</Link>
              <p className="text-xs text-zinc-500">
                {summary.attempted}/{summary.total} attempted
                {summary.attempted > 0 && <> · mastery {Math.round(summary.mastery * 100)}%</>}
              </p>
              <ProgressBar value={summary.progress} label={`${domain.name} progress`} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
