// packages
import { describe, expect, it } from 'vitest';
import { FiBox } from 'react-icons/fi';

// content
import { DOMAINS } from './taxonomy';
import { domainGlyph, domainGlyphs, subjectGlyph, subjectGlyphs } from './glyphs';

describe('glyphs', () => {
  it.each(DOMAINS.map((domain) => [domain.id, domain] as const))('domain %s has an explicit glyph', (id) => {
    expect(Object.prototype.hasOwnProperty.call(domainGlyphs, id)).toBe(true);
  });

  it.each(
    DOMAINS.flatMap((domain) => domain.subjects.map((subject) => [`${domain.id}/${subject.id}`, subject.id] as const)),
  )('subject %s has an explicit glyph', (_path, subjectId) => {
    expect(Object.prototype.hasOwnProperty.call(subjectGlyphs, subjectId)).toBe(true);
  });

  it('falls back to FiBox for an unknown domain id', () => {
    expect(domainGlyph('does-not-exist')).toBe(FiBox);
  });

  it('falls back to FiBox for an unknown subject id', () => {
    expect(subjectGlyph('does-not-exist')).toBe(FiBox);
  });
});
