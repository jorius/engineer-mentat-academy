// packages
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { DOMAINS, domainName } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrills } from '../hooks/useDrills';
import { useLocale } from '../hooks/useLocale';

// components
import { Card } from '../components/primitives/Card';
import { Glyph } from '../components/primitives/Glyph';
import { ProgressBar } from '../components/primitives/ProgressBar';

// utils
import { reviewQueueCount } from '../utils/reviewQueue';
import { describeDrill, drillStatus } from '../utils/drillProgress';

export function Home(): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const { list, byId } = useQuestionBank();
  const { progress } = useProgress();
  const { drills } = useDrills();
  const overall = summarize(list, progress);
  // Same rule Review uses to build its queue: missed on the last attempt, or marked for review.
  const missed = reviewQueueCount(list, progress);
  // Drills come newest first, so this is the most recent one with questions left to answer.
  const unfinished = drills
    .map((drill) => ({ drill, status: drillStatus(drill, progress, (id) => byId.has(id)) }))
    .find(({ status }) => status.total > 0 && !status.finished);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('home.title')}</h1>
        <p className="text-zinc-500">{t('home.tagline', { total: overall.total, attempted: overall.attempted, missed })}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/drill?unseen=1" className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">{t('home.drillUnseen')}</Link>
        <Link to="/mock" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">{t('home.mockInterview')}</Link>
        <Link to="/review" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">{t('home.reviewMissed', { count: missed })}</Link>
        {unfinished === undefined ? null : (
          <Link to={`/drill/${unfinished.drill.id}`} className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">
            {t('home.continueDrill', {
              name: unfinished.drill.name ?? describeDrill(unfinished.drill.query, t, locale),
              done: unfinished.status.done,
              total: unfinished.status.total,
            })}
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          const name = domainName(domain, locale);
          return (
            <Card key={domain.id} className="space-y-1">
              <Link to={`/browse/${domain.id}`} className="font-medium underline">
                <Glyph kind="domain" id={domain.id} className="mr-1" />
                {name}
              </Link>
              <p className="text-xs text-zinc-500">
                {t('common.attempted', { attempted: summary.attempted, total: summary.total })}
                {summary.attempted > 0 && ` · ${t('common.mastery', { percent: Math.round(summary.mastery * 100) })}`}
              </p>
              <ProgressBar value={summary.progress} label={t('common.progressLabel', { name })} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
