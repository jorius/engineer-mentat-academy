// engine
import type { Question } from '../engine/question';
import { KIND_LABELS, kindLabel } from '../engine/labels';
import type { Translate } from '../engine/labels';

// content
import { findTopic, topicName } from '../content/taxonomy';

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const UNTERMINATED_FENCE = /```[\s\S]*$/;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const INLINE_CODE = /`([^`]+)`/g;
const BOLD = /\*\*([^*]+)\*\*/g;
const ITALIC_STAR = /\*([^*]+)\*/g;
// Only treats `_word_` as italic when the underscores sit at a word boundary
// (start/end of string or surrounded by whitespace/punctuation), so dunder
// identifiers like `__proto__` pass through untouched.
const ITALIC_UNDERSCORE = /(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,;:!?]|$)/g;
const WHITESPACE = /\s+/g;

const ELLIPSIS = '…';

function stripFencedCode(prompt: string): string {
  // Paired fences first, then any trailing fence marker that never closes
  // (an unterminated ``` through the end of the prompt).
  return prompt.replace(FENCED_CODE_BLOCK, '').replace(UNTERMINATED_FENCE, '');
}

function firstParagraph(text: string): string {
  for (const paragraph of text.split(/\n\s*\n/)) {
    const trimmed = paragraph.trim();
    if (trimmed !== '') {
      return trimmed;
    }
  }
  return '';
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(MARKDOWN_LINK, '$1')
    .replace(INLINE_CODE, '$1')
    .replace(BOLD, '$1')
    .replace(ITALIC_STAR, '$1')
    .replace(ITALIC_UNDERSCORE, '$1$2')
    .replace(WHITESPACE, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const limit = max - ELLIPSIS.length;
  const cut = text.slice(0, limit);
  const nextChar = text[limit];
  const cutsMidWord = nextChar !== undefined && nextChar !== ' ';
  const lastSpace = cut.lastIndexOf(' ');
  const boundary = cutsMidWord && lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${boundary.trimEnd()}${ELLIPSIS}`;
}

export type SummaryOptions = {
  /** UI language for the topic-name fallback; defaults to English. */
  locale?: string;
  /** Translate function for the kind label in the fallback; defaults to the English label. */
  t?: Translate;
  /** Maximum length before truncating with an ellipsis. */
  max?: number;
};

function fallbackSummary(question: Question, locale: string, t: Translate | undefined): string {
  const topic = findTopic(question.domain, question.subject, question.topic);
  const topicLabel = topic === undefined ? question.topic : topicName(topic, locale);
  const kind = t === undefined ? KIND_LABELS[question.kind].label : kindLabel(question.kind, t).label;
  return `${kind}: ${topicLabel}`;
}

export function questionSummary(question: Question, { locale = 'en', t, max = 90 }: SummaryOptions = {}): string {
  const withoutCode = stripFencedCode(question.prompt);
  const paragraph = firstParagraph(withoutCode);
  const plain = stripInlineMarkdown(paragraph);
  if (plain === '') {
    return fallbackSummary(question, locale, t);
  }
  return truncate(plain, max);
}
