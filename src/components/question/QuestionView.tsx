// packages
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// engine
import type { Answer, Question } from '../../engine/question';
import type { GradeResult } from '../../engine/grader';

// contexts
import { useGrader } from '../../contexts/GraderContext';

// hooks
import { useProgress } from '../../hooks/useProgress';

// components
import { Markdown } from '../common/Markdown';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Feedback } from './Feedback';
import { SingleChoice } from './SingleChoice';
import { MultiChoice } from './MultiChoice';
import { PredictOutput } from './PredictOutput';
import { CodeExercise } from './CodeExercise';
import { SqlExercise } from './SqlExercise';
import { OpenAnswer } from './OpenAnswer';

type Props = { question: Question; onNext?: () => void; position?: { index: number; total: number } };

function AnswerArea({ question, disabled, onSubmit }: { question: Question; disabled: boolean; onSubmit: (a: Answer) => void }): JSX.Element {
  switch (question.kind) {
    case 'single':
      return <SingleChoice question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'multi':
      return <MultiChoice question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'predict':
      return <PredictOutput question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'code':
    case 'fix':
      return <CodeExercise question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'sql':
      return <SqlExercise question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'open':
      return <OpenAnswer question={question} disabled={disabled} onSubmit={onSubmit} />;
  }
}

export function QuestionView({ question, onNext, position }: Props): JSX.Element {
  const grader = useGrader();
  const { store, progress } = useProgress();
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const entry = progress[question.id];
  const flagged = entry?.flagged ?? false;

  useEffect(() => {
    setResult(null);
    setGrading(false);
  }, [question.id]);

  const submit = useCallback(
    async (answer: Answer): Promise<void> => {
      setGrading(true);
      try {
        const graded = await grader.grade(question, answer);
        setResult(graded);
        store.record(question.id, graded.score);
      } finally {
        setGrading(false);
      }
    },
    [grader, question, store],
  );

  const toggleFlag = useCallback((): void => store.setFlag(question.id, !flagged), [store, question.id, flagged]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target !== null && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'n' && result !== null && onNext !== undefined) {
        onNext();
      }
      if (event.key === 'f') {
        toggleFlag();
      }
    };
    window.addEventListener('keydown', onKey);
    return (): void => window.removeEventListener('keydown', onKey);
  }, [result, onNext, toggleFlag]);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {position !== undefined && <span>{position.index + 1} / {position.total}</span>}
        <Badge tone={question.level}>{question.level}</Badge>
        <Badge>{question.kind}</Badge>
        <Link to={`/browse/${question.domain}/${question.subject}`} className="underline">{question.subject} · {question.topic}</Link>
        <Link to={`/q/${question.id}`} className="ml-auto underline">permalink</Link>
        <Button variant="ghost" onClick={toggleFlag} aria-pressed={flagged}>{flagged ? 'Flagged' : 'Flag'}</Button>
      </div>
      <Markdown text={question.prompt} />
      <AnswerArea question={question} disabled={grading || result !== null} onSubmit={submit} />
      {grading && <p className="text-sm text-zinc-500">Grading…</p>}
      {result !== null && (
        <div className="space-y-3">
          <Feedback result={result} />
          <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Explanation</p>
            <Markdown text={question.explanation} />
          </div>
          {onNext !== undefined && <Button onClick={onNext}>Next (N)</Button>}
        </div>
      )}
      <label className="block text-xs text-zinc-500">
        Notes
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={2}
          defaultValue={entry?.notes ?? ''}
          onBlur={(event): void => store.setNotes(question.id, event.target.value)}
        />
      </label>
    </Card>
  );
}
