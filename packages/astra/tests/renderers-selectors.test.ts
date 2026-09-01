import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import type { GenericNode } from 'myst-common';
import { mergeRenderers } from '@myst-theme/providers';
import { DEFAULT_RENDERERS, selectRenderer } from 'myst-to-react';

import { ASTRA_RENDERERS } from '../src/renderers';
import { AstraDataSources } from '../src/renderers/AstraDataSources';
import { AstraDecision } from '../src/renderers/AstraDecision';
import { AstraFinding } from '../src/renderers/AstraFinding';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import { AstraOutput } from '../src/renderers/AstraOutput';
import { AstraPriorInsight } from '../src/renderers/AstraPriorInsight';
import { AstraSubanalysis } from '../src/renderers/AstraSubanalysis';
import { AstraValue } from '../src/renderers/AstraValue';

const renderers = mergeRenderers([DEFAULT_RENDERERS, ASTRA_RENDERERS], true);

interface DispatchCase {
  type: string;
  token: string;
  renderer: ComponentType<any>;
}

const dispatchCases: DispatchCase[] = [
  { type: 'span', token: 'astra-ref', renderer: AstraInlineRef },
  { type: 'span', token: 'astra-ref--value', renderer: AstraValue },
  { type: 'container', token: 'astra-output', renderer: AstraOutput },
  { type: 'paragraph', token: 'astra-output', renderer: AstraOutput },
  { type: 'div', token: 'astra-output', renderer: AstraOutput },
  { type: 'div', token: 'astra-decision', renderer: AstraDecision },
  { type: 'div', token: 'astra-finding', renderer: AstraFinding },
  {
    type: 'admonition',
    token: 'astra-prior-insight',
    renderer: AstraPriorInsight,
  },
  { type: 'table', token: 'astra-inputs', renderer: AstraDataSources },
  { type: 'table', token: 'astra-outputs', renderer: AstraDataSources },
  { type: 'card', token: 'astra-subanalysis', renderer: AstraSubanalysis },
];

function selected(node: GenericNode) {
  return selectRenderer(renderers, node);
}

describe('ASTRA renderer dispatch', () => {
  it.each(dispatchCases)(
    'dispatches $type.$token at every string-token position and in class arrays',
    ({ type, token, renderer }) => {
      for (const className of [
        token,
        `${token} author-class`,
        `author-class ${token}`,
        `before ${token} after`,
        ['author-class', token],
        [token, 'author-class'],
      ]) {
        expect(selected({ type, class: className } as GenericNode)).toBe(renderer);
      }
    },
  );

  it.each(dispatchCases)(
    'does not dispatch $type.$token for author classes that merely contain its text',
    ({ type, token }) => {
      const base = renderers[type]?.base;
      expect(base).toBeTypeOf('function');

      for (const className of [
        `not-${token}`,
        `${token}-ish`,
        `prefix${token}`,
        `${token}suffix`,
        `before not-${token} after`,
        ['author-class', `not-${token}`],
        ['author-class', `${token}--modifier-without-base`],
      ]) {
        expect(selected({ type, class: className } as GenericNode)).toBe(base);
      }
    },
  );

  it('uses the value renderer when a span carries both reference tokens', () => {
    for (const className of [
      'astra-ref astra-ref--value',
      'before astra-ref after astra-ref--value',
      'astra-ref--value before astra-ref after',
      ['astra-ref', 'astra-ref--value'],
      ['astra-ref--value', 'astra-ref'],
    ]) {
      expect(selected({ type: 'span', class: className } as GenericNode)).toBe(
        AstraValue,
      );
    }
  });

  it('leaves produced data/report details on the stock collapsible renderer', () => {
    expect(
      selected({
        type: 'details',
        class: ['myst-dropdown', 'astra-output', 'astra-output--data'],
      } as GenericNode),
    ).toBe(renderers.details?.base);
  });

  it('leaves ordinary nodes on their stock renderer', () => {
    for (const type of [
      'span',
      'container',
      'paragraph',
      'div',
      'details',
      'admonition',
      'table',
      'card',
    ]) {
      expect(selected({ type, class: 'author-class' } as GenericNode)).toBe(
        renderers[type]?.base,
      );
    }
  });
});
