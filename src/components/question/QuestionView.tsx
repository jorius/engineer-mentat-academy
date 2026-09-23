// packages
import { useEffect, useEffectEvent, useId, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import { attemptReducer, initialAttemptState, recordedScore, shouldRecord } from '../../engine/attempts';
import type { AttemptEvent, AttemptState } from '../../engine/attempts';
import type { GradeResult } from '../../engine/grader';
import type { Answer, Question } from '../../engine/question';
import { kindLabel } from '../../engine/labels';

// contexts
import { useGrader } from '../../contexts/GraderContext';

// hooks
import { usePreferences } from '../../hooks/usePreferences';
import { useProgress } from '../../hooks/useProgress';
import { useCanonicalQuestion, useQuestionBank } from '../../hooks/useQuestionBank';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Markdown } from '../common/Markdown';
import { Card } from '../primitives/Card';
import { ActionBar } from './ActionBar';
import { AttemptsPill } from './AttemptsPill';
import { CodeExercise } from './CodeExercise';
import { Feedback } from './Feedback';
import { HeaderStrip } from './HeaderStrip';
import { MultiChoice } from './MultiChoice';
import { NotesDrawer } from './NotesDrawer';
import { OpenAnswer } from './OpenAnswer';
import { PredictOutput } from './PredictOutput';
import { SchemaDrawer } from './SchemaDrawer';
import { SingleChoice } from './SingleChoice';
import { SqlExercise } from './SqlExercise';

type Props = { question: Question; onNext?: () => void; position?: { index: number; total: number } };

/** Every kind's answer value, held here so the action bar can submit, reset and fill them. */
type Answers = {
  selectedId: string | null;
  selectedIds: string[];
  text: string;
  source: string;
  query: string;
  openDraft: string;
  openRevealed: boolean;
  openChecked: boolean[];
};

// Grader feedback lines that name the correct options; hidden while attempts remain so a wrong
// submit never reveals the key early. The grader itself is unchanged.
const ANSWER_KEY_PREFIXES = ['Correct answer:', 'Missing:', 'Should not be selected:'];

// A predict mismatch line names the expected output; while attempts remain only the learner's own
// line is kept. The expected part is matched greedily so a quote inside it can never leak.
const PREDICT_LINE = /^Line (\d+): expected "[\s\S]*", got "([\s\S]*)"$/;

function initialAnswers(question: Question): Answers {
  return {
    selectedId: null,
    selectedIds: [],
    text: '',
    source: question.kind === 'code' || question.kind === 'fix' ? question.starter : '',
    query: '',
    openDraft: '',
    openRevealed: false,
    openChecked: question.kind === 'open' ? question.rubric.map(() => false) : [],
  };
}

function answerFor(question: Question, answers: Answers): Answer | null {
  switch (question.kind) {
    case 'single':
      return answers.selectedId === null ? null : { kind: 'single', optionId: answers.selectedId };
    case 'multi':
      return answers.selectedIds.length === 0 ? null : { kind: 'multi', optionIds: answers.selectedIds };
    case 'predict':
      return answers.text.trim().length === 0 ? null : { kind: 'predict', text: answers.text };
    case 'code':
    case 'fix':
      return { kind: 'code', source: answers.source };
    case 'sql':
      return answers.query.trim().length === 0 ? null : { kind: 'sql', query: answers.query };
    case 'open':
      return answers.openRevealed ? { kind: 'open', checked: answers.openChecked, text: answers.openDraft } : null;
  }
}

/** The answer values once the reference is revealed (Show answer or out of attempts): the canonical output, solution or query. */
function shownAnswers(canonical: Question, answers: Answers): Answers {
  switch (canonical.kind) {
    case 'predict':
      return { ...answers, text: canonical.answer };
    case 'code':
    case 'fix':
      return { ...answers, source: canonical.solution };
    case 'sql':
      return { ...answers, query: canonical.answer };
    default:
      return answers;
  }
}

function correctOptionIds(canonical: Question): string[] {
  if (canonical.kind === 'single') {
    return [canonical.answer];
  }
  if (canonical.kind === 'multi') {
    return canonical.answer;
  }
  return [];
}

function withoutAnswerKey(result: GradeResult, lineGot: (n: string, got: string) => string): GradeResult {
  const feedback = result.feedback
    .filter((line) => !ANSWER_KEY_PREFIXES.some((prefix) => line.startsWith(prefix)))
    .map((line) => {
      const match = PREDICT_LINE.exec(line);
      return match === null ? line : lineGot(match[1] ?? '', match[2] ?? '');
    });
  return { ...result, feedback };
}

/** Focuses the first single-choice option not locked by a wrong pick, so focus never lands on a disabled Submit. */
function focusFirstUnlockedOption(pane: HTMLElement | null, question: Question, lockedOptionIds: string[]): void {
  if (pane === null || question.kind !== 'single') {
    return;
  }
  const index = question.options.findIndex((option) => !lockedOptionIds.includes(option.id));
  pane.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus();
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable);
}

function hasResettableInput(question: Question): boolean {
  return question.kind === 'predict' || question.kind === 'code' || question.kind === 'fix' || question.kind === 'sql';
}

type InputProps = {
  question: Question;
  answers: Answers;
  update: (patch: Partial<Answers>) => void;
  onSubmit: () => void;
  disabled: boolean;
  readOnly: boolean;
  lockedOptionIds: string[];
  correctOptionIds: string[] | undefined;
};

function AnswerInput({ question, answers, update, onSubmit, disabled, readOnly, lockedOptionIds, correctOptionIds: correct }: InputProps): JSX.Element {
  switch (question.kind) {
    case 'single':
      return (
        <SingleChoice
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
          value={answers.selectedId}
          onChange={(selectedId): void => update({ selectedId })}
          lockedOptionIds={lockedOptionIds}
          correctOptionIds={correct}
          submitLabelHidden
        />
      );
    case 'multi':
      return (
        <MultiChoice
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
          value={answers.selectedIds}
          onChange={(selectedIds): void => update({ selectedIds })}
          lockedOptionIds={lockedOptionIds}
          correctOptionIds={correct}
          submitLabelHidden
        />
      );
    case 'predict':
      return (
        <PredictOutput question={question} disabled={disabled} onSubmit={onSubmit} value={answers.text} onChange={(text): void => update({ text })} readOnly={readOnly} submitLabelHidden hideCode />
      );
    case 'code':
    case 'fix':
      return (
        <CodeExercise question={question} disabled={disabled} onSubmit={onSubmit} value={answers.source} onChange={(source): void => update({ source })} readOnly={readOnly} submitLabelHidden hideReset />
      );
    case 'sql':
      return (
        <SqlExercise question={question} disabled={disabled} onSubmit={onSubmit} value={answers.query} onChange={(query): void => update({ query })} readOnly={readOnly} submitLabelHidden hideSchema />
      );
    case 'open':
      return (
        <OpenAnswer
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
          value={answers.openDraft}
          onChange={(openDraft): void => update({ openDraft })}
          readOnly={readOnly}
          revealed={answers.openRevealed}
          onReveal={(): void => update({ openRevealed: true })}
          checked={answers.openChecked}
          onCheckedChange={(openChecked): void => update({ openChecked })}
          submitLabelHidden
          hideReveal
        />
      );
  }
}

export function QuestionView({ question: given, onNext, position }: Props): JSX.Element {
  const { t } = useTranslation();
  // Show the question in the active language (a queue built before a language switch still holds the
  // old text), but grade the canonical English question so option ids and answer keys never depend on
  // the locale. Questions outside the bank (tests, previews) are used as given.
  const question = useQuestionBank().byId.get(given.id) ?? given;
  const canonical = useCanonicalQuestion(given.id) ?? given;
  const grader = useGrader();
  const { store, progress } = useProgress();
  const { maxAttempts } = usePreferences().preferences;
  const [attempt, dispatch] = useReducer(
    (state: AttemptState, event: AttemptEvent): AttemptState => attemptReducer(state, event, maxAttempts),
    initialAttemptState,
  );
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(question));
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSavedNotes = (id: string): boolean => (progress[id]?.notes ?? '').trim().length > 0;
  // Saved notes open with their question so they are seen on a revisit.
  const [notesOpen, setNotesOpen] = useState(() => hasSavedNotes(question.id));
  const [currentId, setCurrentId] = useState(question.id);
  const notesId = useId();
  const activeId = useRef(question.id);
  const previous = useRef(attempt);
  const notesRef = useRef<HTMLDivElement>(null);
  const notesButtonRef = useRef<HTMLButtonElement>(null);
  const answerPaneRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // A new question (callers usually remount through `key`, but not all do) starts from a clean slate.
  if (currentId !== question.id) {
    setCurrentId(question.id);
    setAnswers(initialAnswers(question));
    setGrading(false);
    setError(null);
    setNotesOpen(hasSavedNotes(question.id));
    dispatch({ type: 'NEW_QUESTION' });
  }

  useEffect(() => {
    activeId.current = question.id;
  }, [question.id]);

  // Progress is recorded exactly once, on the transition into 'resolved'. Focus follows the attempt so
  // keyboard users never sit on a control that just became disabled: a wrong single-choice pick moves
  // to the first unlocked option, and resolving moves to Next (or the feedback panel without Next).
  useEffect(() => {
    const prev = previous.current;
    previous.current = attempt;
    if (shouldRecord(prev, attempt)) {
      store.record(question.id, recordedScore(attempt));
      (nextRef.current ?? feedbackRef.current)?.focus();
    } else if (attempt.phase === 'wrong' && attempt.attemptsUsed > prev.attemptsUsed) {
      focusFirstUnlockedOption(answerPaneRef.current, question, attempt.lockedOptionIds);
    }
  }, [attempt, store, question]);

  const entry = progress[question.id];
  const marked = entry?.flagged ?? false;
  const kind = kindLabel(question.kind, t);
  const resolved = attempt.phase === 'resolved';
  const isOpen = question.kind === 'open';
  const pending = answerFor(question, answers);
  const submitDisabled = resolved || grading || (!isOpen && pending === null);
  const showAnswerDisabled = resolved || grading;
  // Show answer and running out of attempts both reveal the reference answer, read-only.
  const referenceShown = resolved && (attempt.outcome === 'shown' || attempt.outcome === 'exhausted');
  const displayedAnswers = referenceShown ? shownAnswers(canonical, answers) : answers;

  const update = (patch: Partial<Answers>): void => setAnswers((current) => ({ ...current, ...patch }));

  const toggleMark = (): void => store.setFlag(question.id, !marked);

  // The reducer has no error event, so SUBMIT_START is dispatched together with the result: a grader
  // failure (a crashed worker) leaves the attempt untouched and the question retryable.
  const submit = async (): Promise<void> => {
    if (isOpen && !answers.openRevealed) {
      if (!resolved && !grading) {
        update({ openRevealed: true });
      }
      return;
    }
    if (submitDisabled || pending === null) {
      return;
    }
    const id = question.id;
    setGrading(true);
    setError(null);
    try {
      const result = await grader.grade(canonical, pending);
      if (activeId.current !== id) {
        return;
      }
      dispatch({ type: 'SUBMIT_START' });
      dispatch({ type: 'SUBMIT_RESULT', result, kind: question.kind, submittedOptionId: pending.kind === 'single' ? pending.optionId : undefined });
      if (pending.kind === 'single' && result.verdict === 'fail') {
        update({ selectedId: null });
      }
    } catch (err) {
      if (activeId.current === id) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (activeId.current === id) {
        setGrading(false);
      }
    }
  };

  const showAnswer = (): void => {
    if (showAnswerDisabled) {
      return;
    }
    dispatch({ type: 'SHOW_ANSWER' });
  };

  const reset = (): void => {
    setAnswers((current) => ({ ...current, text: '', query: '', source: initialAnswers(question).source }));
    dispatch({ type: 'RESET' });
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent): void => {
    const plain = !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    // Inside My notes the shortcuts stand down: Ctrl+Enter never submits (or spends an attempt) and
    // Esc closes the drawer, handing focus back to its header button.
    if (event.target instanceof Node && notesRef.current?.contains(event.target) === true) {
      if (event.key === 'Escape' && plain) {
        event.preventDefault();
        notesButtonRef.current?.focus();
        setNotesOpen(false);
      }
      return;
    }
    if (event.key === 'Enter' && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
      // Captured before the editor sees it, so Ctrl+Enter submits instead of inserting a line.
      event.preventDefault();
      event.stopPropagation();
      void submit();
      return;
    }
    if (!plain || isTypingTarget(event.target)) {
      return;
    }
    if (event.key === 'Escape') {
      setNotesOpen(false);
    } else if (event.key.toLowerCase() === 'n') {
      if (resolved && onNext !== undefined) {
        onNext();
      }
    } else if (event.key.toLowerCase() === 'm') {
      toggleMark();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => onKeyDown(event);
    window.addEventListener('keydown', listener, true);
    return (): void => window.removeEventListener('keydown', listener, true);
  }, []);

  const submitLabel = isOpen ? (answers.openRevealed ? t('question.submitSelfScore') : t('question.reveal')) : t('question.submit');
  const showFullFeedback = resolved && attempt.outcome !== 'shown' && attempt.lastResult !== undefined;

  return (
    <Card className="space-y-4">
      <HeaderStrip
        question={question}
        position={position}
        marked={marked}
        onToggleMark={toggleMark}
        notesOpen={notesOpen}
        hasNotes={hasSavedNotes(question.id)}
        notesId={notesId}
        onToggleNotes={(): void => setNotesOpen((open) => !open)}
        notesButtonRef={notesButtonRef}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <Markdown text={question.prompt} />
          {question.kind === 'predict' && (
            <CodeEditor value={question.code} onChange={(): void => undefined} language={question.language} readOnly ariaLabel={t('question.program')} />
          )}
          {question.kind === 'sql' && <SchemaDrawer schema={question.schema} />}
          <p className="text-xs text-zinc-400">{kind.hint}</p>
          <NotesDrawer key={question.id} ref={notesRef} id={notesId} open={notesOpen} notes={entry?.notes ?? ''} onSave={(notes): void => store.setNotes(question.id, notes)} />
        </div>
        <div ref={answerPaneRef} className="min-w-0 space-y-3">
          <AnswerInput
            key={question.id}
            question={question}
            answers={displayedAnswers}
            update={update}
            onSubmit={(): void => void submit()}
            disabled={grading || resolved}
            readOnly={resolved}
            lockedOptionIds={attempt.lockedOptionIds}
            correctOptionIds={resolved ? correctOptionIds(canonical) : undefined}
          />
          {grading && <p className="text-sm text-zinc-500">{t('question.grading')}</p>}
          {error !== null && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {t('question.gradingFailed', { error })}
            </p>
          )}
          {attempt.phase === 'wrong' && attempt.lastResult !== undefined && <Feedback result={withoutAnswerKey(attempt.lastResult, (n, got): string => t('question.lineGot', { n, got }))} retry />}
          {resolved && (
            <div ref={feedbackRef} tabIndex={-1} className="space-y-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
              {showFullFeedback && attempt.lastResult !== undefined && <Feedback result={attempt.lastResult} />}
              <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('question.explanation')}</p>
                <Markdown text={question.explanation} />
              </div>
            </div>
          )}
        </div>
      </div>
      <ActionBar
        pill={<AttemptsPill kind={question.kind} state={attempt} maxAttempts={maxAttempts} />}
        resolved={resolved}
        busy={grading}
        onReset={hasResettableInput(question) ? reset : undefined}
        onShowAnswer={isOpen ? undefined : showAnswer}
        showAnswerDisabled={showAnswerDisabled}
        submitLabel={submitLabel}
        onSubmit={(): void => void submit()}
        submitDisabled={submitDisabled}
        onNext={onNext}
        nextRef={nextRef}
      />
    </Card>
  );
}
