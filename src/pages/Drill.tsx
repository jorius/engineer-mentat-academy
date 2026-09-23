// packages
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { JSX } from 'react';

// engine
import { filterQuestions } from '../engine/registry';
import { shuffle } from '../engine/session';
import type { Question } from '../engine/question';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';

// utils
import { parseDrillFilter } from '../utils/drillFilter';

function DrillQueue({ questions, unseen }: { questions: Question[]; unseen: boolean }): JSX.Element {
  const { progress } = useProgress();
  // The queue is chosen once, when this component mounts for the current filter (see the `key` on
  // the caller below); answering a question updates `progress`, but must not reshuffle or reset it.
  const [queue] = useState(() => shuffle(unseen ? questions.filter((q) => (progress[q.id]?.attempts ?? 0) === 0) : questions));
  const drill = useDrillQueue(queue);

  if (queue.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Drill</h1>
        <p>No questions match this filter.</p>
        <Link to="/browse" className="underline">Pick a subject</Link>
      </div>
    );
  }
  if (drill.done || drill.current === undefined) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Drill complete</h1>
        <p>You went through {drill.total} questions.</p>
        <div className="flex gap-2">
          <Link to="/review"><Button>Review misses</Button></Link>
          <Link to="/browse"><Button variant="ghost">Browse</Button></Link>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Drill</h1>
      <QuestionView key={drill.current.id} question={drill.current} onNext={drill.next} position={{ index: drill.index, total: drill.total }} />
    </div>
  );
}

export function Drill(): JSX.Element {
  const [params] = useSearchParams();
  const { list: bank } = useQuestionBank();
  const filter = useMemo(() => parseDrillFilter(params), [params]);
  const matched = useMemo(() => filterQuestions(bank, filter), [bank, filter]);
  return <DrillQueue key={params.toString()} questions={matched} unseen={filter.unseen} />;
}
