// packages
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// content
import { DOMAINS, domainName, findDomain, findSubject, subjectName, topicName } from '../content/taxonomy';

// engine
import { filterQuestions } from '../engine/registry';
import { shuffle } from '../engine/session';
import { LEVELS } from '../engine/question';
import type { Kind, Level, Question } from '../engine/question';
import { kindLabel, levelLabel } from '../engine/labels';
import type { SavedDrill } from '../engine/drills';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrills } from '../hooks/useDrills';
import { useLocale } from '../hooks/useLocale';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';
import { Glyph } from '../components/primitives/Glyph';
import { ChipGroup } from '../components/filters/ChipGroup';
import { OnlyChips } from '../components/filters/OnlyChips';

// utils
import { drillQuery, inScope, matchesOnly, narrowing, parseDrillFilter } from '../utils/drillFilter';
import type { DrillFilter, Only } from '../utils/drillFilter';
import { facets } from '../utils/filterFacets';
import { doneInDrill, drillStatus } from '../utils/drillProgress';

const SELECT_CLASS = 'rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900';

function DrillSetup(): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { list: bank } = useQuestionBank();
  const { progress } = useProgress();
  const [domainId, setDomainId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [levels, setLevels] = useState<Level[]>([]);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [only, setOnly] = useState<Only | null>(null);

  const domain = findDomain(domainId);
  const subject = domain === undefined ? undefined : findSubject(domain.id, subjectId);
  const topic = subject?.topics.find((tp) => tp.id === topicId);
  const scope = filterQuestions(bank, { domain: domain?.id, subject: subject?.id, topic: topic?.id });
  const allLevels = [...new Set(scope.map((q) => q.level))];
  const allKinds = [...new Set(scope.map((q) => q.kind))];
  const groups = facets(scope, { levels: inScope(levels, allLevels), kinds: inScope(kinds, allKinds) });
  const levelFilter = narrowing(levels, allLevels);
  const kindFilter = narrowing(kinds, allKinds);
  const matched = filterQuestions(scope, { levels: levelFilter, kinds: kindFilter }).filter((q) => only === null || matchesOnly(progress[q.id], only));

  const start = (): void => {
    const query = drillQuery({ domain: domain?.id, subject: subject?.id, topic: topic?.id, levels: levelFilter, kinds: kindFilter, only });
    // An empty query would bring this setup card back, so "everything" is spelled out as every level.
    if (query.toString() === '') {
      query.set('level', LEVELS.join(','));
    }
    void navigate(`/drill?${query.toString()}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('drill.title')}</h1>
      <Card className="space-y-4">
        <h2 className="font-medium">{t('drill.setupTitle')}</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              {domain === undefined ? null : <Glyph kind="domain" id={domain.id} />}
              {t('drill.domain')}
            </span>
            <select
              className={SELECT_CLASS}
              value={domainId}
              onChange={(e): void => {
                setDomainId(e.target.value);
                setSubjectId('');
                setTopicId('');
              }}
            >
              <option value="">{t('drill.all')}</option>
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>{domainName(d, locale)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              {subject === undefined ? null : <Glyph kind="subject" id={subject.id} />}
              {t('drill.subject')}
            </span>
            <select
              className={SELECT_CLASS}
              value={subjectId}
              disabled={domain === undefined}
              onChange={(e): void => {
                setSubjectId(e.target.value);
                setTopicId('');
              }}
            >
              <option value="">{t('drill.all')}</option>
              {domain?.subjects.map((s) => (
                <option key={s.id} value={s.id}>{subjectName(s, locale)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('drill.topic')}
            <select className={SELECT_CLASS} value={topicId} disabled={subject === undefined} onChange={(e): void => setTopicId(e.target.value)}>
              <option value="">{t('drill.all')}</option>
              {subject?.topics.map((tp) => (
                <option key={tp.id} value={tp.id}>{topicName(tp, locale)}</option>
              ))}
            </select>
          </label>
        </div>
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
        <div className="flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-sm text-zinc-500">{t('drill.matchCount', { count: matched.length })}</p>
          <Button className="ml-auto" disabled={matched.length === 0} onClick={start}>{t('drill.start')}</Button>
        </div>
      </Card>
    </div>
  );
}

function NoMatch(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{t('drill.title')}</h1>
      <p>{t('drill.noMatch')}</p>
      <Link to="/browse" className="underline">{t('drill.pickSubject')}</Link>
    </div>
  );
}

function MissingDrill(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{t('drill.title')}</h1>
      <p>{t('drill.missing')}</p>
      <Link to="/drill" className="underline">{t('drill.myDrills')}</Link>
    </div>
  );
}

/** Turns a `/drill?…` filter into a saved drill and replaces the URL with the drill's own. */
function DrillCreator({ questions, filter, query }: { questions: Question[]; filter: DrillFilter; query: string }): JSX.Element | null {
  const { progress } = useProgress();
  const { store } = useDrills();
  const navigate = useNavigate();
  // The order is chosen once, when this component mounts for the current filter (see the `key` on the
  // caller below), and frozen into the saved drill.
  const [questionIds] = useState(() =>
    shuffle(
      questions.filter(
        (q) => (!filter.unseen || matchesOnly(progress[q.id], 'unseen')) && (filter.only === undefined || matchesOnly(progress[q.id], filter.only)),
      ),
    ).map((q) => q.id),
  );
  // StrictMode runs mount effects twice; the ref keeps that to a single drill.
  const created = useRef(false);

  useEffect(() => {
    if (created.current || questionIds.length === 0) {
      return;
    }
    created.current = true;
    const drill = store.create({ query, questionIds });
    void navigate(`/drill/${drill.id}`, { replace: true });
  }, [questionIds, query, store, navigate]);

  return questionIds.length === 0 ? <NoMatch /> : null;
}

function SavedDrillRun({ drill }: { drill: SavedDrill }): JSX.Element {
  const { t } = useTranslation();
  const { byId } = useQuestionBank();
  const { store: progressStore, progress } = useProgress();
  const { store } = useDrills();
  const exists = (id: string): boolean => byId.has(id);
  const status = drillStatus(drill, progress, exists);
  const openId = (target: SavedDrill): string | undefined => target.questionIds.filter(exists)[drillStatus(target, progressStore.all(), exists).nextIndex];
  // Answering records progress at once, which moves `nextIndex`; the answered question stays on screen
  // with its feedback until Next, Skip or Restart picks the next open one.
  const [shownId, setShownId] = useState<string | undefined>(() => openId(drill));
  const ids = drill.questionIds.filter(exists);
  const currentId = shownId !== undefined && ids.includes(shownId) ? shownId : ids[status.nextIndex];
  const current = currentId === undefined ? undefined : byId.get(currentId);

  const advance = (): void => setShownId(openId(store.get(drill.id) ?? drill));
  const restart = (): void => {
    store.restart(drill.id);
    advance();
  };

  if (status.total === 0) {
    return <MissingDrill />;
  }
  if (current === undefined) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t('drill.completeTitle')}</h1>
        <p>{t('drill.completeBody', { count: status.total })}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/review"><Button>{t('drill.reviewMisses')}</Button></Link>
          <Button variant="ghost" onClick={restart}>{t('drill.restart')}</Button>
          <Link to="/drill"><Button variant="ghost">{t('drill.myDrills')}</Button></Link>
          <Link to="/browse"><Button variant="ghost">{t('drill.browse')}</Button></Link>
        </div>
      </div>
    );
  }
  // The position counts the other done questions, so it holds steady while the current one is answered.
  const index = status.done - (doneInDrill(drill, progress[current.id]) ? 1 : 0);
  const skip = (): void => {
    store.skip(drill.id, current.id);
    advance();
  };
  return (
    <div className="space-y-4">
      <QuestionView
        key={current.id}
        question={current}
        onNext={advance}
        onSkip={status.total - status.done > 1 ? skip : undefined}
        position={{ index, total: status.total }}
      />
    </div>
  );
}

export function SavedDrillPage(): JSX.Element {
  const { drillId = '' } = useParams();
  const { store } = useDrills();
  const drill = store.get(drillId);
  if (drill === undefined) {
    return <MissingDrill />;
  }
  return <SavedDrillRun key={drill.id} drill={drill} />;
}

export function Drill(): JSX.Element {
  const [params] = useSearchParams();
  const { list: bank } = useQuestionBank();
  const filter = useMemo(() => parseDrillFilter(params), [params]);
  const matched = useMemo(() => filterQuestions(bank, filter), [bank, filter]);
  const query = params.toString();
  if (query === '') {
    return <DrillSetup />;
  }
  return <DrillCreator key={query} questions={matched} filter={filter} query={query} />;
}
