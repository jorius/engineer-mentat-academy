// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { DOMAINS, domainName } from '../content/taxonomy';

// engine
import { LEVELS } from '../engine/question';
import { mockPool, pickMock } from '../engine/session';
import type { Kind, Level, Question } from '../engine/question';
import { kindLabel, levelLabel } from '../engine/labels';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useLocale } from '../hooks/useLocale';
import { useDrillQueue } from '../hooks/useDrillQueue';
import { useCountdown } from '../hooks/useCountdown';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';
import { Glyph } from '../components/primitives/Glyph';
import { ChipGroup } from '../components/filters/ChipGroup';
import { Stepper } from '../components/filters/Stepper';

// utils
import { questionSummary } from '../utils/questionSummary';
import { inScope } from '../utils/drillFilter';
import { facets } from '../utils/filterFacets';

type Phase = 'setup' | 'session' | 'results';

/** The setup form; an empty `domains`, `levels` or `kinds` list means all of them. */
type MockSettings = { count: number; minutes: number; timed: boolean; domains: string[]; levels: Level[]; kinds: Kind[] };

const DEFAULT_SETTINGS: MockSettings = { count: 10, minutes: 30, timed: true, domains: [], levels: [], kinds: [] };

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** `minutes` is null for an untimed mock: no clock is shown and the countdown never starts. */
function Session({ questions, minutes, onFinish }: { questions: Question[]; minutes: number | null; onFinish: () => void }): JSX.Element {
  const { t } = useTranslation();
  const queue = useDrillQueue(questions);
  const timed = minutes !== null;
  const { remaining, expired } = useCountdown((minutes ?? 0) * 60, timed && !queue.done);
  const timeUp = timed && expired;
  if (queue.done || timeUp || queue.current === undefined) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t('mock.title')}</h1>
        <p>{timeUp ? t('mock.timeUp') : t('mock.allAnswered')}</p>
        <Button onClick={onFinish}>{t('mock.seeResults')}</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {timed ? (
        <p className={`font-mono text-lg ${remaining < 60 ? 'text-red-500' : ''}`} aria-live="polite" aria-label={t('mock.timeRemaining')}>{formatClock(remaining)}</p>
      ) : null}
      <QuestionView key={queue.current.id} question={queue.current} onNext={queue.next} onSkip={queue.next} position={{ index: queue.index, total: queue.total }} />
    </div>
  );
}

/** "All" when nothing or everything is picked, else the picked labels in their canonical order. */
function describeSelection<T>(ordered: readonly T[], selected: readonly T[], label: (value: T) => string, all: string): string {
  const picked = ordered.filter((value) => selected.includes(value));
  return picked.length === 0 || picked.length === ordered.length ? all : picked.map(label).join(', ');
}

type SetupProps = { settings: MockSettings; onChange(next: MockSettings): void; onStart(questions: Question[]): void };

function MockSetup({ settings, onChange, onStart }: SetupProps): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const { list } = useQuestionBank();
  const { count, minutes, timed, domains, levels, kinds } = settings;
  const update = (patch: Partial<MockSettings>): void => onChange({ ...settings, ...patch });

  // Level and kind chips only list what the chosen domains contain; a pick hidden by a domain change
  // is ignored rather than silently emptying the pool.
  const scope = mockPool(list, { domains, levels: [], kinds: [] });
  const scopeLevels = LEVELS.filter((level) => scope.some((q) => q.level === level));
  const scopeKinds = [...new Set(scope.map((q) => q.kind))];
  const options = { domains, levels: inScope(levels, scopeLevels), kinds: inScope(kinds, scopeKinds) };
  const groups = facets(scope, { levels: options.levels, kinds: options.kinds });
  const available = mockPool(list, options).length;

  const effectiveCount = Math.min(count, available);
  const summaryValues = {
    count: effectiveCount,
    minutes,
    available,
    scope: describeSelection(DOMAINS, DOMAINS.filter((d) => domains.includes(d.id)), (d) => domainName(d, locale), t('mock.allDomains')),
    levels: describeSelection(scopeLevels, options.levels, (level) => levelLabel(level, t).label, t('mock.allLevels')),
  };
  const perQuestion = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(minutes / Math.max(effectiveCount, 1));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('mock.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-medium">{t('mock.format')}</h2>
          <Stepper label={t('mock.questions')} value={count} min={1} max={50} onChange={(next): void => update({ count: next })} hint={t('mock.available', { count: available })} />
          <Stepper label={t('mock.minutes')} value={minutes} min={5} max={180} onChange={(next): void => update({ minutes: next })} hint={t('mock.perQuestion', { minutes: perQuestion })} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-20 font-medium">{t('mock.timer')}</span>
            <div role="radiogroup" aria-label={t('mock.timer')} className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  role="radio"
                  aria-checked={timed === value}
                  onClick={(): void => update({ timed: value })}
                  className={`px-3 py-1 text-xs font-medium transition ${timed === value ? 'bg-accent-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {value ? t('mock.timed') : t('mock.untimed')}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-medium">{t('mock.scope')}</h2>
          <ChipGroup
            label={t('mock.domains')}
            options={DOMAINS.map((d) => ({ value: d.id, label: domainName(d, locale), glyph: <Glyph kind="domain" id={d.id} /> }))}
            selected={domains}
            onChange={(next): void => update({ domains: next })}
          />
          <ChipGroup
            label={t('filters.level')}
            options={groups.levels.map((facet) => ({ value: facet.value, count: facet.count, ...levelLabel(facet.value, t) }))}
            selected={levels}
            onChange={(next): void => update({ levels: next })}
          />
          <ChipGroup
            label={t('filters.kind')}
            options={groups.kinds.map((facet) => ({ value: facet.value, count: facet.count, ...kindLabel(facet.value, t) }))}
            selected={kinds}
            onChange={(next): void => update({ kinds: next })}
          />
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="text-sm text-zinc-500">{timed ? t('mock.summary', summaryValues) : t('mock.summaryUntimed', summaryValues)}</p>
        <Button className="ml-auto" disabled={available === 0 || count < 1} onClick={(): void => onStart(pickMock(list, { count, ...options }))}>
          {t('mock.start')}
        </Button>
      </div>
    </div>
  );
}

export function Mock(): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const { byId } = useQuestionBank();
  const { progress } = useProgress();
  const [phase, setPhase] = useState<Phase>('setup');
  const [settings, setSettings] = useState<MockSettings>(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startedAt, setStartedAt] = useState<string>('');

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
        <Session questions={questions} minutes={settings.timed ? settings.minutes : null} onFinish={(): void => setPhase('results')} />
      </div>
    );
  }
  if (phase === 'results') {
    const answered = results.filter((r) => r.attempted);
    const mean = answered.length === 0 ? 0 : answered.reduce((s, r) => s + r.score, 0) / answered.length;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t('mock.resultsTitle')}</h1>
        <p>{t('mock.resultsSummary', { answered: answered.length, total: results.length, percent: Math.round(mean * 100) })}</p>
        {results.map((r) => (
          <Card key={r.question.id} className="flex items-center gap-2 text-sm">
            <Link to={`/q/${r.question.id}`} className="underline">{questionSummary(byId.get(r.question.id) ?? r.question, { locale, t })}</Link>
            <span className="ml-auto">{r.attempted ? `${Math.round(r.score * 100)}%` : t('mock.skipped')}</span>
          </Card>
        ))}
        <Button onClick={(): void => setPhase('setup')}>{t('mock.newMock')}</Button>
      </div>
    );
  }
  return (
    <MockSetup
      settings={settings}
      onChange={setSettings}
      onStart={(picked): void => {
        setQuestions(picked);
        setStartedAt(new Date().toISOString());
        setPhase('session');
      }}
    />
  );
}
