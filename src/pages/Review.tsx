// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Badge } from '../components/primitives/Badge';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

export function Review(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [drilling, setDrilling] = useState(false);
  const [snapshot, setSnapshot] = useState(progress);

  const source = drilling ? snapshot : progress;
  const queue = useMemo(
    () =>
      list
        .filter((q) => {
          const entry = source[q.id];
          return entry !== undefined && (entry.flagged || (entry.attempts > 0 && entry.lastScore < 1));
        })
        .sort((a, b) => (source[a.id]?.lastAt ?? '').localeCompare(source[b.id]?.lastAt ?? '')),
    [list, source],
  );
  const drill = useDrillQueue(drilling ? queue : []);

  if (drilling && drill.current !== undefined && !drill.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Review</h1>
        <QuestionView key={drill.current.id} question={drill.current} onNext={drill.next} position={{ index: drill.index, total: drill.total }} />
      </div>
    );
  }
  if (drilling && drill.done) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Review complete</h1>
        <Button onClick={(): void => setDrilling(false)}>Back to the list</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Review</h1>
        <Button className="ml-auto" disabled={queue.length === 0} onClick={(): void => { setSnapshot(progress); setDrilling(true); }}>Drill all {queue.length}</Button>
      </div>
      {queue.length === 0 && <p>Nothing to review. Missed and flagged questions land here.</p>}
      {queue.map((q) => {
        const entry = progress[q.id];
        return (
          <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={q.level}>{q.level}</Badge>
            <Badge>{q.kind}</Badge>
            <Link to={`/q/${q.id}`} className="underline">{q.prompt.split('\n')[0]?.slice(0, 90)}</Link>
            <span className="ml-auto text-xs text-zinc-500">
              {(entry?.attempts ?? 0) > 0 ? `${Math.round((entry?.lastScore ?? 0) * 100)}%` : 'unattempted'}{entry?.flagged === true ? ' · flagged' : ''}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
