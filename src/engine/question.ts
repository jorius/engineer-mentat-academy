// packages
import { z } from 'zod';

export const LEVELS = ['junior', 'mid', 'senior'] as const;
export type Level = (typeof LEVELS)[number];

export const KINDS = ['single', 'multi', 'predict', 'code', 'fix', 'sql', 'open'] as const;
export type Kind = (typeof KINDS)[number];

export const SOURCES = ['epam-pdf', 'notion', 'topic-list'] as const;
export type Source = (typeof SOURCES)[number];

export const CODE_LANGUAGES = ['javascript', 'typescript'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const baseSchema = z.object({
  id: z.string().regex(idPattern, 'id must be kebab-case'),
  domain: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  level: z.enum(LEVELS),
  prompt: z.string().min(1),
  tags: z.array(z.string()),
  source: z.enum(SOURCES),
  explanation: z.string().min(1),
});

export const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export type Option = z.infer<typeof optionSchema>;

export const testCaseSchema = z.object({
  name: z.string().min(1),
  args: z.array(z.unknown()),
  expected: z.unknown(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

const codeFields = {
  language: z.enum(CODE_LANGUAGES),
  starter: z.string(),
  tests: z.array(testCaseSchema).min(1),
  solution: z.string().min(1),
};

export const singleSchema = baseSchema.extend({
  kind: z.literal('single'),
  options: z.array(optionSchema).min(2),
  answer: z.string().min(1),
});
export const multiSchema = baseSchema.extend({
  kind: z.literal('multi'),
  options: z.array(optionSchema).min(2),
  answer: z.array(z.string().min(1)).min(1),
});
export const predictSchema = baseSchema.extend({
  kind: z.literal('predict'),
  language: z.enum(CODE_LANGUAGES),
  code: z.string().min(1),
  answer: z.string().min(1),
});
export const codeSchema = baseSchema.extend({ kind: z.literal('code'), ...codeFields });
export const fixSchema = baseSchema.extend({ kind: z.literal('fix'), ...codeFields });
export const sqlSchema = baseSchema.extend({
  kind: z.literal('sql'),
  schema: z.string().min(1),
  answer: z.string().min(1),
  expectedRows: z.array(z.array(z.unknown())),
  ordered: z.boolean().optional(),
});
export const openSchema = baseSchema.extend({
  kind: z.literal('open'),
  modelAnswer: z.string().min(1),
  rubric: z.array(z.string().min(1)).min(2),
});

export const questionSchema = z.discriminatedUnion('kind', [
  singleSchema,
  multiSchema,
  predictSchema,
  codeSchema,
  fixSchema,
  sqlSchema,
  openSchema,
]);

export type SingleQuestion = z.infer<typeof singleSchema>;
export type MultiQuestion = z.infer<typeof multiSchema>;
export type PredictQuestion = z.infer<typeof predictSchema>;
export type CodeQuestion = z.infer<typeof codeSchema>;
export type FixQuestion = z.infer<typeof fixSchema>;
export type SqlQuestion = z.infer<typeof sqlSchema>;
export type OpenQuestion = z.infer<typeof openSchema>;
export type Question = z.infer<typeof questionSchema>;

export type Answer =
  | { kind: 'single'; optionId: string }
  | { kind: 'multi'; optionIds: string[] }
  | { kind: 'predict'; text: string }
  | { kind: 'code'; source: string }
  | { kind: 'sql'; query: string }
  | { kind: 'open'; checked: boolean[]; text: string };
