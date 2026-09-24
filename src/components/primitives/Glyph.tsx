// packages
import { createElement } from 'react';
import type { JSX } from 'react';

// content
import { domainGlyph, subjectGlyph } from '../../content/glyphs';

const DEFAULT_CLASS = 'inline-block shrink-0 align-[-0.125em]';

type Props = {
  kind: 'domain' | 'subject';
  id: string;
  className?: string;
};

// Icon selection resolves to a stable component reference from a fixed map (see content/glyphs.ts),
// never a freshly created component; createElement (instead of a dynamic JSX tag) keeps the React
// Compiler's static-components check from flagging this lookup as component creation during render.
export function Glyph({ kind, id, className }: Props): JSX.Element {
  const Icon = kind === 'domain' ? domainGlyph(id) : subjectGlyph(id);
  return createElement(Icon, { 'aria-hidden': 'true', size: '1em', className: className === undefined ? DEFAULT_CLASS : `${DEFAULT_CLASS} ${className}` });
}
