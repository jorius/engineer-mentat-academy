// packages
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { findDomain, findSubject } from '../content/taxonomy';

// engine
import { filterQuestions } from '../engine/registry';
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level } from '../engine/question';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Badge } from '../components/primitives/Badge';
import { Card } from '../components/primitives/Card';

export function BrowseSubject(): JSX.Element {
  const { domain: domainId = '', subject: subjectId = '' } = useParams();
  const domain = findDomain(domainId);
  const subject = findSubject(domainId, subjectId);
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [levels, setLevels] = useState<Level[]>([...LEVELS]);
  const [kinds, setKinds] = useState<Kind[]>([...KINDS]);

  if (domain === undefined || subject === undefined) {
    return <p>Subject not found.</p>;
  }

  const questions = filterQuestions(list, { domain: domain.id, subject: subject.id, levels, kinds });
  const drillParams = new URLSearchParams({ domain: domain.id, subject: subject.id, level: levels.join(','), kind: kinds.join(',') });

  const toggle = <T extends string>(value: T, current: T[], set: (next: T[]) => void): void =>
    set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        <Link to="/browse" className="underline">Browse</Link> / <Link to={`/browse/${domain.id}`} className="underline">{domain.name}</Link> / {subject.name}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{subject.name}</h1>
        <Link to={`/drill?${drillParams.toString()}`} className="ml-auto rounded-md bg-spice-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-spice-600">Drill these {questions.length}</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {LEVELS.map((level) => (
          <label key={level} className="flex items-center gap-1"><input type="checkbox" checked={levels.includes(level)} onChange={(): void => toggle(level, levels, setLevels)} />{level}</label>
        ))}
        <span className="mx-2 text-zinc-400">|</span>
        {KINDS.map((kind) => (
          <label key={kind} className="flex items-center gap-1"><input type="checkbox" checked={kinds.includes(kind)} onChange={(): void => toggle(kind, kinds, setKinds)} />{kind}</label>
        ))}
      </div>
      {subject.topics.map((topic) => {
        const own = questions.filter((q) => q.topic === topic.id);
        if (own.length === 0) {
          return null;
        }
        return (
          <section key={topic.id} className="space-y-2">
            <h2 className="text-lg font-medium">{topic.name}</h2>
            {own.map((q) => {
              const entry = progress[q.id];
              return (
                <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={q.level}>{q.level}</Badge>
                  <Badge>{q.kind}</Badge>
                  <Link to={`/q/${q.id}`} className="underline">{q.prompt.split('\n')[0]?.slice(0, 90)}</Link>
                  <span className="ml-auto text-xs text-zinc-500">
                    {entry === undefined || entry.attempts === 0 ? 'unseen' : `${Math.round(entry.lastScore * 100)}% · ${entry.attempts}x`}
                    {entry?.flagged === true ? ' · flagged' : ''}
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
