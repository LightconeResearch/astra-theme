import { ASTRA_RENDERERS } from '../src/renderers';

describe('ASTRA renderer boundary', () => {
  it('overrides only canonical inline references and leaves blocks upstream', () => {
    expect(Object.keys(ASTRA_RENDERERS)).toEqual(['span']);
    expect(Object.keys(ASTRA_RENDERERS.span as object)).toEqual([
      'span[class*="astra-ref"]',
    ]);
    expect((ASTRA_RENDERERS.span as Record<string, unknown>).base).toBeUndefined();
  });
});
