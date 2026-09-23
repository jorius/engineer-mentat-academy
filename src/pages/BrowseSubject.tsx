// packages
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { domainName, findDomain, findSubject, subjectName, topicName } from '../content/taxonomy';

// engine
import { filterQuestions } from '../engine/registry';
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level } from '../engine/question';
import { kindLabel, levelLabel } from '../engine/labels';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useLocale } from '../hooks/useLocale';

// components
import { Badge } from '../components/primitives/Badge';
import { Card } from '../components/primitives/Card';

// utils
import { questionSummary } from '../utils/questionSummary';

export function BrowseSubject(): JSX.Element {
  const { t } = useTranslation();
  const { domain: domainId = '', subject: subjectId = '' } = useParams();
  const domain = findDomain(domainId);
  const subject = findSubject(domainId, subjectId);
  const locale = useLocale();
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [levels, setLevels] = useState<Level[]>([...LEVELS]);
  const [kinds, setKinds] = useState<Kind[]>([...KINDS]);

  if (domain === undefined || subject === undefined) {
    return <p>{t('browse.subjectNotFound')}</p>;
  }

  const questions = filterQuestions(list, { domain: domain.id, subject: subject.id, levels, kinds });
  const drillParams = new URLSearchParams({ domain: domain.id, subject: subject.id, level: levels.join(','), kind: kinds.join(',') });

  const toggle = <T extends string>(value: T, current: T[], set: (next: T[]) => void): void =>
    set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        <Link to="/browse" className="underline">{t('browse.title')}</Link> / <Link to={`/browse/${domain.id}`} className="underline">{domainName(domain, locale)}</Link> / {subjectName(subject, locale)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{subjectName(subject, locale)}</h1>
        <Link to={`/drill?${drillParams.toString()}`} className="ml-auto rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600">{t('browse.drillThese', { count: questions.length })}</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {LEVELS.map((level) => (
          <label key={level} title={levelLabel(level, t).hint} className="flex items-center gap-1">
            <input type="checkbox" checked={levels.includes(level)} onChange={(): void => toggle(level, levels, setLevels)} />
            {levelLabel(level, t).label}
          </label>
        ))}
        <span className="mx-2 text-zinc-400">|</span>
        {KINDS.map((kind) => (
          <label key={kind} title={kindLabel(kind, t).hint} className="flex items-center gap-1">
            <input type="checkbox" checked={kinds.includes(kind)} onChange={(): void => toggle(kind, kinds, setKinds)} />
            {kindLabel(kind, t).label}
          </label>
        ))}
      </div>
      {subject.topics.map((topic) => {
        const own = questions.filter((q) => q.topic === topic.id);
        if (own.length === 0) {
          return null;
        }
        return (
          <section key={topic.id} className="space-y-2">
            <h2 className="text-lg font-medium">{topicName(topic, locale)}</h2>
            {own.map((q) => {
              const entry = progress[q.id];
              const level = levelLabel(q.level, t);
              const kind = kindLabel(q.kind, t);
              return (
                <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={q.level} title={level.hint}>{level.label}</Badge>
                  <Badge title={kind.hint}>{kind.label}</Badge>
                  <Link to={`/q/${q.id}`} className="underline">{questionSummary(q, { locale, t })}</Link>
                  <span className="ml-auto text-xs text-zinc-500">
                    {entry === undefined || entry.attempts === 0 ? t('common.unseen') : t('common.scoreAttempts', { percent: Math.round(entry.lastScore * 100), count: entry.attempts })}
                    {entry?.flagged === true ? ` · ${t('common.flagged')}` : ''}
                  </span>
                </Card>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
