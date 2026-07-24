import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InventoryProse, parseInventoryProse } from '../src/inventory/InventoryProse';

describe('inventory preview prose', () => {
  it('tokenizes inline code and inline math', () => {
    expect(parseInventoryProse('fit $\\alpha$ from `qiso`')).toMatchObject([
      { type: 'text', value: 'fit ' },
      { type: 'inlineMath', value: '\\alpha' },
      { type: 'text', value: ' from ' },
      { type: 'inlineCode', value: 'qiso' },
    ]);
  });

  it('renders display math without a MyST renderer context', () => {
    const html = renderToStaticMarkup(
      <InventoryProse text={'posterior $$\\Sigma = J C J^T$$'} />,
    );
    expect(html).toContain('class="katex-display"');
    expect(html).toContain('inventory-prose__display-math');
    expect(html).not.toContain('$$\\Sigma = J C J^T$$');
  });

  it('leaves unbalanced delimiters as literal text', () => {
    expect(parseInventoryProse('costs $5 at most')).toEqual([
      { type: 'text', value: 'costs $5 at most' },
    ]);
  });
});
