// packages
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function Browse(): JSX.Element {
  const { t } = useTranslation();
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('browse.title')}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          return (
            <Link key={domain.id} to={`/browse/${domain.id}`} aria-label={t('common.questionCount', { name: domain.name, count: summary.total })}>
              <Card className="h-full space-y-2 hover:border-accent-500">
                <p className="text-lg font-medium">{domain.name}</p>
                <p className="text-sm text-zinc-500">{domain.blurb}</p>
                <p className="text-xs text-zinc-500">
                  {t('common.attempted', { attempted: summary.attempted, total: summary.total })}
                  {summary.attempted > 0 && ` · ${t('common.mastery', { percent: Math.round(summary.mastery * 100) })}`}
                </p>
                <ProgressBar value={summary.progress} label={t('common.progressLabel', { name: domain.name })} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
