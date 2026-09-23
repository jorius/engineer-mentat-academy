// packages
import { useEffect, useRef, useState } from 'react';
import { Link, useHref, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JSX, MouseEvent } from 'react';

// content
import { findSubject, findTopic, subjectName, topicName } from '../../content/taxonomy';

// engine
import type { Question } from '../../engine/question';
import { kindLabel, levelLabel } from '../../engine/labels';

// hooks
import { useLocale } from '../../hooks/useLocale';

// components
import { Badge } from '../primitives/Badge';

const TOAST_MS = 2000;

type Props = {
  question: Question;
  position?: { index: number; total: number };
  marked: boolean;
  onToggleMark: () => void;
  notesOpen: boolean;
  hasNotes: boolean;
  notesId: string;
  onToggleNotes: () => void;
};

const toolClass =
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800';

export function HeaderStrip({ question, position, marked, onToggleMark, notesOpen, hasNotes, notesId, onToggleNotes }: Props): JSX.Element {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const permalinkPath = `/q/${question.id}`;
  const permalinkHref = useHref(permalinkPath);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kind = kindLabel(question.kind, t);
  const level = levelLabel(question.level, t);
  const subject = findSubject(question.domain, question.subject);
  const topic = findTopic(question.domain, question.subject, question.topic);

  useEffect(
    () => (): void => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  // A plain click copies the permalink and stays on the page (leaving a Mock or Drill would lose the
  // session); modified clicks keep the native link behavior, and a blocked clipboard falls back to navigating.
  const copyPermalink = async (event: MouseEvent<HTMLAnchorElement>): Promise<void> => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(new URL(permalinkHref, window.location.href).href);
      setCopied(true);
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), TOAST_MS);
    } catch {
      void navigate(permalinkPath);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 text-xs text-zinc-500 dark:border-zinc-800">
      {position !== undefined && <span>{t('question.position', { index: position.index + 1, total: position.total })}</span>}
      <Badge tone={question.level} title={level.hint}>{level.label}</Badge>
      <Badge title={kind.hint}>{kind.label}</Badge>
      <Link to={`/browse/${question.domain}/${question.subject}`} className="underline">
        {subject === undefined ? question.subject : subjectName(subject, locale)} · {topic === undefined ? question.topic : topicName(topic, locale)}
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" className={toolClass} onClick={onToggleMark} aria-pressed={marked} title={t('question.markHint')}>
          <span aria-hidden="true" className={marked ? 'text-accent-500' : ''}>{marked ? '★' : '☆'}</span>
          {marked ? t('question.marked') : t('question.markForReview')}
        </button>
        <button type="button" className={toolClass} onClick={onToggleNotes} aria-expanded={notesOpen} aria-controls={notesId} title={t('question.notesHint')}>
          <span aria-hidden="true">📝</span>
          {t('question.notes')}
          {hasNotes && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-500" />}
        </button>
        <span className="relative">
          <Link to={permalinkPath} className={toolClass} aria-label={t('question.permalink')} title={t('question.permalink')} onClick={(event): void => void copyPermalink(event)}>
            <span aria-hidden="true">⛓</span>
          </Link>
          {copied && (
            <span role="status" className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow dark:bg-zinc-100 dark:text-zinc-900">
              {t('question.copied')}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
