// packages
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { findDomain } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function BrowseDomain(): JSX.Element {
  const { t } = useTranslation();
  const { domain: domainId = '' } = useParams();
  const domain = findDomain(domainId);
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  if (domain === undefined) {
    return <p>{t('browse.domainNotFound')}</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500"><Link to="/browse" className="underline">{t('browse.title')}</Link> / {domain.name}</p>
      <h1 className="text-2xl font-semibold">{domain.name}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {domain.subjects.map((subject) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id, subject: subject.id }), progress);
          return (
            <Link key={subject.id} to={`/browse/${domain.id}/${subject.id}`} aria-label={t('common.questionCount', { name: subject.name, count: summary.total })}>
              <Card className="h-full space-y-2 hover:border-accent-500">
                <p className="font-medium">{subject.name}</p>
                <p className="text-xs text-zinc-500">{t('browse.subjectStats', { total: summary.total, unseen: summary.unattempted, flagged: summary.flagged })}</p>
                <p className="text-xs text-zinc-500">
                  {t('common.attempted', { attempted: summary.attempted, total: summary.total })}
                  {summary.attempted > 0 && ` · ${t('common.mastery', { percent: Math.round(summary.mastery * 100) })}`}
                </p>
                <ProgressBar value={summary.progress} label={t('common.progressLabel', { name: subject.name })} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
