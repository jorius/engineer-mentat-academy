// packages
import { describe, expect, it } from 'vitest';

// utils
import { containerWidth } from './containerWidth';

describe('containerWidth', () => {
  it('widens the shell on the question screens', () => {
    expect(containerWidth('/drill')).toBe('max-w-screen-2xl');
    expect(containerWidth('/mock')).toBe('max-w-screen-2xl');
    expect(containerWidth('/review')).toBe('max-w-screen-2xl');
    expect(containerWidth('/q/js-closures-1')).toBe('max-w-screen-2xl');
  });

  it('keeps the reading pages narrow', () => {
    expect(containerWidth('/')).toBe('max-w-5xl');
    expect(containerWidth('/browse')).toBe('max-w-5xl');
    expect(containerWidth('/browse/languages/javascript')).toBe('max-w-5xl');
    expect(containerWidth('/settings')).toBe('max-w-5xl');
    expect(containerWidth('/quiz')).toBe('max-w-5xl');
  });
});
