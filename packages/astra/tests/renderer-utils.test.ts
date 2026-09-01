import { describe, expect, it } from 'vitest';

import { displayScope, safeNavigationHref } from '../src/rendererUtils';

describe('displayScope', () => {
  it('removes only the conventional active-universe clause', () => {
    expect(
      displayScope(
        'LRG1/LRG2/LRG3/ELG1 under the baseline universe.',
        'baseline',
      ),
    ).toBe('LRG1/LRG2/LRG3/ELG1.');
    expect(displayScope('All tracers, baseline universe.', 'baseline')).toBe(
      'All tracers.',
    );
    expect(displayScope('baseline universe.', 'baseline')).toBeUndefined();
    expect(displayScope('The baseline sample.', 'baseline')).toBe(
      'The baseline sample.',
    );
    expect(displayScope('All tracers in the c000 universe.', 'c000')).toBe(
      'All tracers.',
    );
  });
});

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
