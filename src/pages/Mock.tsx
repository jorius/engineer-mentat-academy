// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { DOMAINS } from '../content/taxonomy';

// engine
import { LEVELS } from '../engine/question';
import { pickMock } from '../engine/session';
import type { Level, Question } from '../engine/question';
import { LEVEL_LABELS } from '../engine/labels';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';
import { useCountdown } from '../hooks/useCountdown';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

// utils
import { questionSummary } from '../utils/questionSummary';

type Phase = 'setup' | 'session' | 'results';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function Session({ questions, minutes, onFinish }: { questions: Question[]; minutes: number; onFinish: () => void }): JSX.Element {
  const queue = useDrillQueue(questions);
  const { remaining, expired } = useCountdown(minutes * 60, !queue.done);
  if (queue.done || expired || queue.current === undefined) {
    return (
      <div className="space-y-3">
        <p>{expired ? 'Time is up.' : 'All questions answered.'}</p>
        <Button onClick={onFinish}>See results</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className={`font-mono text-lg ${remaining < 60 ? 'text-red-500' : ''}`} aria-live="polite">{formatClock(remaining)}</p>
      <QuestionView key={queue.current.id} question={queue.current} onNext={queue.next} position={{ index: queue.index, total: queue.total }} />
    </div>
  );
}

export function Mock(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(30);
  const [levels, setLevels] = useState<Level[]>([...LEVELS]);
  const [domains, setDomains] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startedAt, setStartedAt] = useState<string>('');

  const toggle = <T extends string>(value: T, current: T[], set: (next: T[]) => void): void =>
    set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  const results = useMemo(
    () =>
      questions.map((q) => {
        const entry = progress[q.id];
        const attempted = entry !== undefined && entry.lastAt >= startedAt;
        return { question: q, score: attempted ? entry.lastScore : 0, attempted };
      }),
    [questions, progress, startedAt],
  );

  if (phase === 'session') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Mock interview</h1>
        <Session questions={questions} minutes={minutes} onFinish={(): void => setPhase('results')} />
      </div>
    );
  }
  if (phase === 'results') {
    const answered = results.filter((r) => r.attempted);
    const mean = answered.length === 0 ? 0 : answered.reduce((s, r) => s + r.score, 0) / answered.length;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Results</h1>
        <p>{answered.length} of {results.length} answered · average {Math.round(mean * 100)}%</p>
        {results.map((r) => (
          <Card key={r.question.id} className="flex items-center gap-2 text-sm">
            <Link to={`/q/${r.question.id}`} className="underline">{questionSummary(r.question)}</Link>
            <span className="ml-auto">{r.attempted ? `${Math.round(r.score * 100)}%` : 'skipped'}</span>
          </Card>
        ))}
        <Button onClick={(): void => setPhase('setup')}>New mock</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mock interview</h1>
      <Card className="space-y-3">
        <label className="block text-sm">
          Questions
          <input type="number" min={1} max={50} value={count} onChange={(e): void => setCount(Number(e.target.value))} className="ml-2 w-20 rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Questions" />
        </label>
        <label className="block text-sm">
          Minutes
          <input type="number" min={5} max={180} value={minutes} onChange={(e): void => setMinutes(Number(e.target.value))} className="ml-2 w-20 rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Minutes" />
        </label>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1">Levels</legend>
          {LEVELS.map((level) => (
            <label key={level} title={LEVEL_LABELS[level].hint} className="flex items-center gap-1">
              <input type="checkbox" checked={levels.includes(level)} onChange={(): void => toggle(level, levels, setLevels)} aria-label={level} />
              {LEVEL_LABELS[level].label}
            </label>
          ))}
        </fieldset>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1">Domains (none selected means all)</legend>
          {DOMAINS.map((domain) => (
            <label key={domain.id} className="flex items-center gap-1"><input type="checkbox" checked={domains.includes(domain.id)} onChange={(): void => toggle(domain.id, domains, setDomains)} />{domain.name}</label>
          ))}
        </fieldset>
        <Button
          disabled={levels.length === 0 || count < 1}
          onClick={(): void => {
            setQuestions(pickMock(list, { count, levels, domains }));
            setStartedAt(new Date().toISOString());
            setPhase('session');
          }}
        >
          Start
        </Button>
      </Card>
    </div>
  );
}
