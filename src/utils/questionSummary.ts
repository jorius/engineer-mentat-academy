// engine
import type { Question } from '../engine/question';
import { KIND_LABELS } from '../engine/labels';

// content
import { findTopic } from '../content/taxonomy';

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const INLINE_CODE = /`([^`]+)`/g;
const BOLD = /\*\*([^*]+)\*\*/g;
const ITALIC = /\*([^*]+)\*|_([^_]+)_/g;
const WHITESPACE = /\s+/g;

const ELLIPSIS = '…';

function firstNonEmptyLine(text: string): string {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '') {
      return trimmed;
    }
  }
  return '';
}

function stripInlineMarkdown(line: string): string {
  return line
    .replace(MARKDOWN_LINK, '$1')
    .replace(INLINE_CODE, '$1')
    .replace(BOLD, '$1')
    .replace(ITALIC, (_match, star: string | undefined, underscore: string | undefined) => star ?? underscore ?? '')
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

function fallbackSummary(question: Question): string {
  const topic = findTopic(question.domain, question.subject, question.topic);
  const topicName = topic?.name ?? question.topic;
  return `${KIND_LABELS[question.kind].label}: ${topicName}`;
}

export function questionSummary(question: Question, max = 90): string {
  const withoutCode = question.prompt.replace(FENCED_CODE_BLOCK, '');
  const line = firstNonEmptyLine(withoutCode);
  const plain = stripInlineMarkdown(line);
  if (plain === '') {
    return fallbackSummary(question);
  }
  return truncate(plain, max);
}
