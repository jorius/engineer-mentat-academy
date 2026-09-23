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
import { useLocale } from '../hooks/useLocale';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function Home(): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const overall = summarize(list, progress);
  const missed = list.filter((q) => (progress[q.id]?.attempts ?? 0) > 0 && (progress[q.id]?.lastScore ?? 1) < 1).length;
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
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          const name = domainName(domain, locale);
          return (
            <Card key={domain.id} className="space-y-1">
              <Link to={`/browse/${domain.id}`} className="font-medium underline">{name}</Link>
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
