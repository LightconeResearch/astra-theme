import { describe, expect, it } from 'vitest';

import { safeNavigationHref } from '../src/rendererUtils';

describe('safeNavigationHref', () => {
  it('accepts trimmed site-relative and explicit HTTP(S) navigation', () => {
    expect(safeNavigationHref(' /analysis?q=1#result ')).toBe(
      '/analysis?q=1#result',
    );
    expect(safeNavigationHref('child/page')).toBe('child/page');
    expect(safeNavigationHref('https://example.org/analysis')).toBe(
      'https://example.org/analysis',
    );
    expect(safeNavigationHref('http://example.org/analysis')).toBe(
      'http://example.org/analysis',
    );
  });

  it('rejects active, malformed and cross-origin protocol-relative targets', () => {
    for (const href of [
      'javascript:alert(1)',
      'data:text/html,unsafe',
      'https:/example.org/malformed',
      '//evil.example/analysis',
      '//astra-theme.invalid/analysis',
      '///astra-theme.invalid/analysis',
      '\\\\evil.example\\analysis',
      '\\\\astra-theme.invalid\\analysis',
      '/analysis\nunsafe',
    ]) {
      expect(safeNavigationHref(href)).toBeUndefined();
    }
  });
});
