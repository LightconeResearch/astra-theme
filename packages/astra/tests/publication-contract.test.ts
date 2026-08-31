import type { ResolvedAnalysisBundle } from '@astra-spec/sdk';
import type { GenericNode } from 'myst-common';
import { describe, expect, it } from 'vitest';

import {
  ASTRA_PUBLICATION_SCHEMA_VERSION,
  findAstraPublication,
} from '../src/publication/contract';

const outputPath = 'nested.outputs.figure';
const cacheToken = 'figure-cache-token';

function bundle(): ResolvedAnalysisBundle {
  return {
    document: {
      schemaVersion: 'astra-resolved-analysis.v1',
      universe: {
        universeId: 'default',
        availableUniverseIds: [],
        source: 'none',
      },
      analysis: {
        version: '1',
        name: 'Publication',
        canonicalPath: '$',
        inputs: [],
        outputs: [],
        decisions: [],
        prior_insights: [],
        findings: [],
        analyses: [
          {
            id: 'nested',
            name: 'Nested analysis',
            canonicalPath: 'nested',
            inputs: [],
            outputs: [
              {
                id: 'figure',
                kind: 'output',
                type: 'figure',
                format: 'png',
                active: true,
                canonicalPath: outputPath,
                provenance: { inputPaths: [], decisionPaths: [] },
                artifact: { byteSize: 42 },
              },
            ],
            decisions: [],
            prior_insights: [],
            findings: [],
            analyses: [],
          },
        ],
      },
    },
    bindings: [
      {
        outputPath,
        path: 'results/default/nested.figure.png',
        cacheToken,
      },
    ],
  };
}

function carrier(
  resolved: ResolvedAnalysisBundle,
  overrides: Record<string, unknown> = {},
): GenericNode {
  return {
    type: 'div',
    class: ['hidden', 'astra-publication-bundle'],
    data: {
      astraPublication: {
        schemaVersion: ASTRA_PUBLICATION_SCHEMA_VERSION,
        activeAnalysisPath: 'nested',
        bundle: resolved,
        ...overrides,
      },
    },
  } as GenericNode;
}

function resourceLink(
  url: string,
  overrides: Record<string, unknown> = {},
): GenericNode {
  return {
    type: 'link',
    static: true,
    url,
    data: {
      astraArtifact: {
        outputPath,
        cacheToken,
        ...overrides,
      },
    },
  } as GenericNode;
}

function resources(...children: GenericNode[]): GenericNode {
  return {
    type: 'div',
    class: 'hidden astra-publication-resources',
    children,
  } as GenericNode;
}

function nestedTree(...children: GenericNode[]): GenericNode {
  return {
    type: 'root',
    children: [
      {
        type: 'section',
        children: [
          {
            type: 'div',
            children,
          },
        ],
      },
    ],
  } as GenericNode;
}

describe('findAstraPublication', () => {
  it('decodes a deeply nested bundle and rejoins its immediately adjacent resource', () => {
    const resolved = bundle();
    const publication = findAstraPublication(
      nestedTree(
        {
          type: 'div',
          identifier: 'pre-transform-id',
          html_id: 'rendered-anchor',
        } as GenericNode,
        carrier(resolved),
        resources(resourceLink('/_build/assets/figure.png')),
        { type: 'div', identifier: 'later-anchor' } as GenericNode,
      ),
    );

    expect(publication?.bundle).toBe(resolved);
    expect(publication?.document).toBe(resolved.document);
    expect(publication?.activeAnalysis.canonicalPath).toBe('nested');
    expect(publication?.index.recordByPath.get(outputPath)?.kind).toBe(
      'output',
    );
    expect(publication?.artifactUrls.get(outputPath)).toBe(
      '/_build/assets/figure.png',
    );
    expect(publication?.placedIdentifiers).toEqual(
      new Set(['rendered-anchor', 'later-anchor']),
    );
  });

  it('does not consume a non-adjacent resource carrier', () => {
    const resolved = bundle();
    const publication = findAstraPublication(
      nestedTree(
        carrier(resolved),
        { type: 'paragraph', children: [] } as GenericNode,
        resources(resourceLink('/_build/assets/figure.png')),
      ),
    );

    expect(publication).toBeDefined();
    expect(publication?.artifactUrls.size).toBe(0);
  });

  it.each([
    ['/assets/figure.png', '/assets/figure.png'],
    ['figure.png?rev=1', 'figure.png?rev=1'],
    ['https://cdn.example.org/figure.png', 'https://cdn.example.org/figure.png'],
    ['http://cdn.example.org/figure.png', 'http://cdn.example.org/figure.png'],
    ['  /assets/figure.png  ', '/assets/figure.png'],
  ])('accepts safe resource URL %j', (url, expected) => {
    const resolved = bundle();
    const publication = findAstraPublication([
      carrier(resolved),
      resources(resourceLink(url)),
    ]);

    expect(publication?.artifactUrls.get(outputPath)).toBe(expected);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,unsafe',
    'mailto:test@example.org',
    '//cdn.example.org/figure.png',
    '//astra-publication.invalid/figure.png',
    '///astra-publication.invalid/figure.png',
    '\\\\cdn.example.org/figure.png',
    '\\\\astra-publication.invalid\\figure.png',
    'https:/cdn.example.org/figure.png',
    '/assets/figure.png\nset-cookie:unsafe',
    '',
  ])('rejects unsafe resource URL %j', (url) => {
    const resolved = bundle();
    const publication = findAstraPublication([
      carrier(resolved),
      resources(resourceLink(url)),
    ]);

    expect(publication?.artifactUrls.size).toBe(0);
  });

  it('requires a static link whose output path and cache token match a binding', () => {
    const resolved = bundle();
    const nonStatic = resourceLink('/non-static.png') as GenericNode & {
      static?: boolean;
    };
    nonStatic.static = false;
    const publication = findAstraPublication([
      carrier(resolved),
      resources(
        nonStatic,
        resourceLink('/wrong-output.png', { outputPath: 'outputs.other' }),
        resourceLink('/stale.png', { cacheToken: 'stale-token' }),
      ),
    ]);

    expect(publication?.artifactUrls.size).toBe(0);
  });

  it.each([
    { schemaVersion: 'astra-publication-bundle.v2' },
    { activeAnalysisPath: 'missing' },
    { bundle: { document: {}, bindings: [] } },
  ])('fails neutrally for an invalid envelope: %j', (overrides) => {
    expect(
      findAstraPublication([carrier(bundle(), overrides)]),
    ).toBeUndefined();
  });

  it.each([
    'analysis path',
    'record path',
    'binding output path',
  ])('rejects a duplicate %s before SDK indexing', (collision) => {
    const resolved = structuredClone(bundle());
    const nested = resolved.document.analysis.analyses[0]!;
    if (collision === 'analysis path') {
      nested.canonicalPath = '$';
    } else if (collision === 'record path') {
      nested.outputs.push(structuredClone(nested.outputs[0]!));
    } else {
      resolved.bindings.push(structuredClone(resolved.bindings[0]!));
    }

    expect(findAstraPublication([carrier(resolved)])).toBeUndefined();
  });

  it('continues in document order after a malformed candidate', () => {
    const resolved = bundle();
    const malformed = carrier(resolved, {
      schemaVersion: 'astra-publication-bundle.v2',
    });
    const publication = findAstraPublication(
      nestedTree(
        malformed,
        {
          type: 'section',
          children: [carrier(resolved)],
        } as GenericNode,
      ),
    );

    expect(publication?.activeAnalysis.canonicalPath).toBe('nested');
  });

  it('returns undefined for absent and carrier-free trees', () => {
    expect(findAstraPublication(undefined)).toBeUndefined();
    expect(findAstraPublication(null)).toBeUndefined();
    expect(findAstraPublication([])).toBeUndefined();
    expect(
      findAstraPublication({ type: 'root', children: [] } as GenericNode),
    ).toBeUndefined();
  });
});
