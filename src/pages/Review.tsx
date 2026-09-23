// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';
import { useLocale } from '../hooks/useLocale';

// engine
import { kindLabel, levelLabel } from '../engine/labels';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Badge } from '../components/primitives/Badge';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

// utils
import { questionSummary } from '../utils/questionSummary';
import { isInReviewQueue } from '../utils/reviewQueue';

export function Review(): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [drilling, setDrilling] = useState(false);
  const [snapshot, setSnapshot] = useState(progress);

  const source = drilling ? snapshot : progress;
  const queue = useMemo(
    () =>
      list
        .filter((q) => isInReviewQueue(source[q.id]))
        .sort((a, b) => (source[a.id]?.lastAt ?? '').localeCompare(source[b.id]?.lastAt ?? '')),
    [list, source],
  );
  const drill = useDrillQueue(drilling ? queue : []);

  if (drilling && drill.current !== undefined && !drill.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t('review.title')}</h1>
        <QuestionView key={drill.current.id} question={drill.current} onNext={drill.next} position={{ index: drill.index, total: drill.total }} />
      </div>
    );
  }
  if (drilling && drill.done) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{t('review.completeTitle')}</h1>
        <Button onClick={(): void => setDrilling(false)}>{t('review.backToList')}</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{t('review.title')}</h1>
        <Button className="ml-auto" disabled={queue.length === 0} onClick={(): void => { setSnapshot(progress); setDrilling(true); }}>{t('review.drillAll', { count: queue.length })}</Button>
      </div>
      {queue.length === 0 && <p>{t('review.empty')}</p>}
      {queue.map((q) => {
        const entry = progress[q.id];
        const level = levelLabel(q.level, t);
        const kind = kindLabel(q.kind, t);
        return (
          <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={q.level} title={level.hint}>{level.label}</Badge>
            <Badge title={kind.hint}>{kind.label}</Badge>
            <Link to={`/q/${q.id}`} className="underline">{questionSummary(q, { locale, t })}</Link>
            <span className="ml-auto text-xs text-zinc-500">
              {(entry?.attempts ?? 0) > 0 ? `${Math.round((entry?.lastScore ?? 0) * 100)}%` : t('common.unattempted')}{entry?.flagged === true ? ` · ${t('common.flagged')}` : ''}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
