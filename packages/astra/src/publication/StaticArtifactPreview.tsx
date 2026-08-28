import * as React from 'react';
import type { ResolvedOutput } from '@astra-spec/sdk';
import {
  ArtifactPreview,
  metricPreviewFromJson,
  tablePreviewFromDelimited,
  tablePreviewFromRows,
  type ArtifactPreviewData,
} from '@astra-spec/ui/components';

import type { AstraArtifactResource } from './contract';

function unavailable(reason: string): ArtifactPreviewData {
  return { kind: 'unavailable', reason };
}

const IMAGE_FORMATS = new Set([
  'avif',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);
const TABLE_FORMATS = new Set(['csv', 'json', 'tab', 'tsv']);
const MAX_IMAGE_PREVIEW_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_PREVIEW_BYTES = 1024 * 1024;

interface ImagePreviewPolicy {
  kind: 'image';
}

interface TextPreviewPolicy {
  kind: 'text';
  format: string;
  maxBytes: number;
}

interface UnavailablePreviewPolicy {
  kind: 'unavailable';
  reason: string;
}

type PreviewPolicy =
  | ImagePreviewPolicy
  | TextPreviewPolicy
  | UnavailablePreviewPolicy;

function normalizedFormat(output: ResolvedOutput): string | undefined {
  const format = output.format?.trim().replace(/^\./, '').toLowerCase();
  return format || undefined;
}

function previewPolicy(output: ResolvedOutput): PreviewPolicy {
  const format = normalizedFormat(output);
  const byteSize = output.artifact?.byteSize;
  if (!output.artifact) {
    return {
      kind: 'unavailable',
      reason: 'This output has not been materialized.',
    };
  }
  if (
    typeof byteSize !== 'number' ||
    !Number.isFinite(byteSize) ||
    byteSize < 0
  ) {
    return {
      kind: 'unavailable',
      reason: 'The artifact size is not available.',
    };
  }
  if (output.type === 'figure') {
    if (!format || !IMAGE_FORMATS.has(format)) {
      return {
        kind: 'unavailable',
        reason: 'This figure format has no safe browser preview.',
      };
    }
    if (byteSize > MAX_IMAGE_PREVIEW_BYTES) {
      return {
        kind: 'unavailable',
        reason: 'This figure is too large to preview.',
      };
    }
    return { kind: 'image' };
  }
  if (output.type === 'table') {
    if (!format || !TABLE_FORMATS.has(format)) {
      return {
        kind: 'unavailable',
        reason: 'This table format has no browser preview.',
      };
    }
    if (byteSize > MAX_TEXT_PREVIEW_BYTES) {
      return {
        kind: 'unavailable',
        reason: 'This table is too large to preview.',
      };
    }
    return { kind: 'text', format, maxBytes: MAX_TEXT_PREVIEW_BYTES };
  }
  if (output.type === 'metric') {
    if (format !== 'json') {
      return {
        kind: 'unavailable',
        reason: 'Metrics can be previewed only from JSON.',
      };
    }
    if (byteSize > MAX_TEXT_PREVIEW_BYTES) {
      return {
        kind: 'unavailable',
        reason: 'This metric is too large to preview.',
      };
    }
    return { kind: 'text', format, maxBytes: MAX_TEXT_PREVIEW_BYTES };
  }
  return {
    kind: 'unavailable',
    reason: 'This output type has no browser preview.',
  };
}

function mediaTypeMatches(format: string, contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  if (format === 'json') {
    return (
      mediaType === 'application/json' ||
      mediaType === 'text/json' ||
      mediaType?.endsWith('+json') === true
    );
  }
  if (format === 'csv') {
    return (
      mediaType === 'text/csv' ||
      mediaType === 'application/csv' ||
      mediaType === 'text/plain'
    );
  }
  return (
    mediaType === 'text/tab-separated-values' || mediaType === 'text/plain'
  );
}

class PreviewResponseError extends Error {}

async function readPreviewText(
  response: Response,
  policy: TextPreviewPolicy,
): Promise<string> {
  if (!mediaTypeMatches(policy.format, response.headers.get('content-type'))) {
    throw new PreviewResponseError(
      'The artifact response has an unexpected media type.',
    );
  }
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (
      !Number.isFinite(contentLength) ||
      contentLength < 0 ||
      contentLength > policy.maxBytes
    ) {
      throw new PreviewResponseError(
        'The artifact response is too large to preview.',
      );
    }
  }
  if (!response.body) {
    throw new PreviewResponseError(
      'The artifact response has no readable body.',
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > policy.maxBytes) {
        await reader.cancel();
        throw new PreviewResponseError(
          'The artifact response is too large to preview.',
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function textPreview(
  output: ResolvedOutput,
  text: string,
  format: string,
): ArtifactPreviewData {
  if (output.type === 'table') {
    if (format === 'json') {
      try {
        const rows = JSON.parse(text);
        if (
          Array.isArray(rows) &&
          rows.every(
            (row) => row && typeof row === 'object' && !Array.isArray(row),
          )
        ) {
          return tablePreviewFromRows(rows as Record<string, unknown>[]);
        }
        return unavailable('The table JSON must be an array of objects.');
      } catch {
        return unavailable('The table artifact is not valid JSON.');
      }
    }
    return tablePreviewFromDelimited(text, {
      delimiter: format === 'tsv' || format === 'tab' ? '\t' : ',',
    });
  }
  if (output.type === 'metric') {
    try {
      return (
        metricPreviewFromJson(JSON.parse(text)) ??
        unavailable('The metric artifact has no scalar value.')
      );
    } catch {
      return unavailable('The metric artifact is not valid JSON.');
    }
  }
  const limit = 100_000;
  return {
    kind: 'text',
    text: text.slice(0, limit),
    truncated: text.length > limit,
    ...(format === 'json' ? { language: 'json' } : {}),
  };
}

export function StaticArtifactPreview({
  output,
  resource,
  compact,
}: {
  output: ResolvedOutput;
  resource: AstraArtifactResource | undefined;
  compact: boolean;
}) {
  const policy = React.useMemo(() => previewPolicy(output), [output]);
  const immediate = React.useMemo<ArtifactPreviewData | undefined>(
    () =>
      policy.kind === 'unavailable'
        ? unavailable(policy.reason)
        : !resource
        ? unavailable('The rewritten artifact resource is not available.')
        : policy.kind === 'image'
        ? { kind: 'image', url: resource.url, alt: output.label ?? output.id }
        : undefined,
    [output.id, output.label, policy, resource],
  );
  const [preview, setPreview] = React.useState<ArtifactPreviewData | undefined>(
    immediate ?? (policy.kind === 'text' ? { kind: 'loading' } : undefined),
  );

  React.useEffect(() => {
    if (!resource || policy.kind !== 'text') {
      setPreview(immediate);
      return undefined;
    }
    const controller = new AbortController();
    setPreview({ kind: 'loading' });
    void fetch(resource.url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return readPreviewText(response, policy);
      })
      .then((text) => {
        setPreview(textPreview(output, text, policy.format));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setPreview(
          unavailable(
            error instanceof PreviewResponseError
              ? error.message
              : 'The artifact preview could not be loaded.',
          ),
        );
      });
    return () => {
      controller.abort();
    };
  }, [immediate, output, policy, resource]);

  return (
    <ArtifactPreview output={output} preview={preview} compact={compact} />
  );
}
