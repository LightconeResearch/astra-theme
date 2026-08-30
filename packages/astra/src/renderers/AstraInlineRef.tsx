import {
  useBaseurl,
  useLinkProvider,
  withBaseurl,
  type NodeRenderer,
} from '@myst-theme/providers';
import { Button, surfaceGlyph } from '@astra-spec/ui/primitives';
import { recordTitle } from '@astra-spec/ui/model';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { useAstraPublication } from '../publication/AstraPublicationProvider';

function classes(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value))
    return value.filter((item) => typeof item === 'string').join(' ');
  return '';
}

function canonicalPath(node: GenericNode): string | undefined {
  const astra = (
    node.data as { astra?: { canonicalPath?: unknown } } | undefined
  )?.astra;
  return typeof astra?.canonicalPath === 'string'
    ? astra.canonicalPath
    : undefined;
}

function analysisHref(node: GenericNode): string | undefined {
  const astra = (
    node.data as {
      astra?: { analysisPath?: unknown; href?: unknown };
    } | undefined
  )?.astra;
  return typeof astra?.analysisPath === 'string' &&
    typeof astra.href === 'string'
    ? astra.href
    : undefined;
}

/** Turn a canonical ASTRA reference into the shared record-dialog trigger. */
export const AstraInlineRef: NodeRenderer = ({ node, className }) => {
  const publication = useAstraPublication();
  const Link = useLinkProvider();
  const baseurl = useBaseurl();
  const canonical = canonicalPath(node);
  const href = analysisHref(node);
  const record = canonical
    ? publication?.index.recordByPath.get(canonical)
    : undefined;
  const carrierClass = [classes(node.class), className]
    .filter(Boolean)
    .join(' ');

  if (!publication || !canonical || !record) {
    return (
      <span
        id={node.html_id}
        className={carrierClass || 'astra-ref'}
        style={node.style}
      >
        {href ? (
          <Link
            to={withBaseurl(href, baseurl)}
            prefetch="intent"
            className="link"
          >
            <MyST ast={node.children} />
          </Link>
        ) : (
          <MyST ast={node.children} />
        )}
      </span>
    );
  }

  const title = recordTitle(record);
  const kindLabel = record.kind.replace(/_/g, ' ');
  return (
    <span
      id={node.html_id}
      className={`${
        carrierClass || 'astra-ref'
      } lightcone-brand astra-ui astra-publication-inline-scope`}
      data-lightcone-color-scheme={publication.colorScheme}
      data-astra-color-scheme={publication.colorScheme}
      style={node.style}
    >
      <Button
        variant="quiet"
        size="small"
        className="astra-publication-ref"
        data-kind={record.kind}
        aria-label={`Open ${kindLabel} details: ${title}`}
        onClick={() => publication.openRecordPath(canonical)}
      >
        <span className="astra-publication-ref__glyph" aria-hidden="true">
          {surfaceGlyph(record.kind)}
        </span>
        <MyST ast={node.children} />
      </Button>
    </span>
  );
};

export default AstraInlineRef;
