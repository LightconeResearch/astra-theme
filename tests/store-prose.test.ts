/**
 * parseStoreProse — tokenizing raw store prose ($math$, `code`) into mdast.
 * The store carries claim/rationale/description fields as RAW strings; the
 * cards render them through this parser so KaTeX / inline-code apply.
 */
import { describe, it, expect } from 'vitest';
import { parseStoreProse } from '~/astra/storeProse';

describe('parseStoreProse', () => {
  it('passes plain text through as a single text node', () => {
    expect(parseStoreProse('no markup here')).toEqual([
      { type: 'text', value: 'no markup here' },
    ]);
  });

  it('tokenizes dollar-math into inlineMath nodes with KaTeX html baked in', () => {
    const nodes = parseStoreProse('fits $\\alpha_\\mathrm{iso}$ per tracer');
    expect(nodes).toMatchObject([
      { type: 'text', value: 'fits ' },
      { type: 'inlineMath', value: '\\alpha_\\mathrm{iso}' },
      { type: 'text', value: ' per tracer' },
    ]);
    // The stock myst-to-react renderer injects node.html and error-tokens
    // without it — the parser must pre-render KaTeX.
    expect((nodes[1] as { html?: string }).html).toContain('katex');
  });

  it('tokenizes backtick spans into inlineCode nodes', () => {
    expect(parseStoreProse('the `qiso` column')).toEqual([
      { type: 'text', value: 'the ' },
      { type: 'inlineCode', value: 'qiso' },
      { type: 'text', value: ' column' },
    ]);
  });

  it('handles mixed math + code, and $ inside code spans', () => {
    expect(
      parseStoreProse('$\\chi^2$ from `col_$std` rows'),
    ).toMatchObject([
      { type: 'inlineMath', value: '\\chi^2' },
      { type: 'text', value: ' from ' },
      { type: 'inlineCode', value: 'col_$std' },
      { type: 'text', value: ' rows' },
    ]);
  });

  it('leaves unbalanced delimiters as literal text', () => {
    expect(parseStoreProse('costs $5 at most')).toEqual([
      { type: 'text', value: 'costs $5 at most' },
    ]);
  });
});
