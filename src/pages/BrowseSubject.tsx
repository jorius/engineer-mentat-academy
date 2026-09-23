// packages
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { domainName, findDomain, findSubject, subjectName, topicName } from '../content/taxonomy';

// engine
import { filterQuestions } from '../engine/registry';
import type { Kind, Level } from '../engine/question';
import { kindLabel, levelLabel } from '../engine/labels';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useLocale } from '../hooks/useLocale';

// components
import { Badge } from '../components/primitives/Badge';
import { Card } from '../components/primitives/Card';
import { ChipGroup } from '../components/filters/ChipGroup';
import { OnlyChips } from '../components/filters/OnlyChips';

// utils
import { questionSummary } from '../utils/questionSummary';
import { facets } from '../utils/filterFacets';
import { drillQuery, inScope, matchesOnly, narrowing } from '../utils/drillFilter';
import type { Only } from '../utils/drillFilter';

export function BrowseSubject(): JSX.Element {
  const { t } = useTranslation();
  const { domain: domainId = '', subject: subjectId = '' } = useParams();
  const domain = findDomain(domainId);
  const subject = findSubject(domainId, subjectId);
  const locale = useLocale();
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [levels, setLevels] = useState<Level[]>([]);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [only, setOnly] = useState<Only | null>(null);

  if (domain === undefined || subject === undefined) {
    return <p>{t('browse.subjectNotFound')}</p>;
  }

  const scope = filterQuestions(list, { domain: domain.id, subject: subject.id });
  const allLevels = [...new Set(scope.map((q) => q.level))];
  const allKinds = [...new Set(scope.map((q) => q.kind))];
  const groups = facets(scope, { levels: inScope(levels, allLevels), kinds: inScope(kinds, allKinds) });
  const levelFilter = narrowing(levels, allLevels);
  const kindFilter = narrowing(kinds, allKinds);
  const questions = filterQuestions(scope, { levels: levelFilter, kinds: kindFilter }).filter((q) => only === null || matchesOnly(progress[q.id], only));
  const drillLink = (topic?: string): string =>
    `/drill?${drillQuery({ domain: domain.id, subject: subject.id, topic, levels: levelFilter, kinds: kindFilter, only }).toString()}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        <Link to="/browse" className="underline">{t('browse.title')}</Link> / <Link to={`/browse/${domain.id}`} className="underline">{domainName(domain, locale)}</Link> / {subjectName(subject, locale)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{subjectName(subject, locale)}</h1>
        <Link to={drillLink()} className="ml-auto rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600">{t('browse.drillThese', { count: questions.length })}</Link>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <ChipGroup
          label={t('filters.level')}
          options={groups.levels.map((facet) => ({ value: facet.value, count: facet.count, ...levelLabel(facet.value, t) }))}
          selected={levels}
          onChange={setLevels}
        />
        <ChipGroup
          label={t('filters.kind')}
          options={groups.kinds.map((facet) => ({ value: facet.value, count: facet.count, ...kindLabel(facet.value, t) }))}
          selected={kinds}
          onChange={setKinds}
        />
        <OnlyChips value={only} onChange={setOnly} />
      </div>
      {subject.topics.map((topic) => {
        const own = questions.filter((q) => q.topic === topic.id);
        if (own.length === 0) {
          return null;
        }
        return (
          <section key={topic.id} className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-medium">{topicName(topic, locale)}</h2>
              <Link to={drillLink(topic.id)} className="ml-auto text-sm text-accent-600 underline hover:text-accent-500">{t('browse.drillTopic', { count: own.length })}</Link>
            </div>
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
