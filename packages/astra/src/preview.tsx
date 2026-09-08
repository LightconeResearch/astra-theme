import * as React from 'react';
import {
  RecordPreview,
  type RecordPreviewEntry,
  type RecordPreviewReferenceRenderer,
} from '@astra-spec/ui/components';
import { LabelsProvider, type AstraLabelOverrides } from '@astra-spec/ui/lib';
import { analysisTitle, recordTitle, type SurfaceKind } from '@astra-spec/ui/model';
import { PreviewPopover } from '@astra-spec/ui/primitives';

import { AstraPreviewCite } from './cite';
import {
  createAstraArtifactRenderer,
  useAstraPublicationDetails,
  type AstraPublication,
} from './publication/AstraPublicationProvider';
import { displayScope } from './rendererUtils';
import { useAstraColorScheme } from './themeScope';

export interface AstraPreviewPopoverProps {
  publication: AstraPublication;
  entry: RecordPreviewEntry;
  trigger: React.ReactElement;
  /** Keep the legacy trigger hotspot/inline styling without vendoring positioning. */
  triggerClassName?: string;
  /** Related preview buttons already hand off through RecordPreview. */
  openDetailsOnTrigger?: boolean;
}

/** Copy retained by the publication theme's pre-astra-ui preview cards. */
const PREVIEW_LABELS = {
  kinds: {
    analysis: 'Sub-analysis',
    prior_insight: 'Prior insight',
  },
  preview: {
    remainingDecisionDetails: (count: number) =>
      `+ ${count} more in the decision panel`,
  },
} satisfies AstraLabelOverrides;

function entryKind(entry: RecordPreviewEntry): SurfaceKind {
  if (entry.kind === 'analysis') return 'analysis';
  return entry.record.kind;
}

function entryTitle(entry: RecordPreviewEntry): string {
  return entry.kind === 'analysis'
    ? analysisTitle(entry.analysis)
    : recordTitle(entry.record);
}

function entryForPreview(
  publication: AstraPublication,
  entry: RecordPreviewEntry,
): RecordPreviewEntry {
  // The released analysis preview intentionally showed its title and counts,
  // while the full analysis page remains the source of descriptive copy.
  if (entry.kind === 'analysis') {
    return entry.analysis.description
      ? { ...entry, analysis: { ...entry.analysis, description: undefined } }
      : entry;
  }
  if (
    entry.kind === 'record' &&
    entry.record.kind === 'input' &&
    entry.record.from &&
    entry.record.resolvedFrom
  ) {
    // Keep the authored alias visible, as it was in the released input card;
    // the canonical target remains available to details and provenance.
    return {
      ...entry,
      record: { ...entry.record, resolvedFrom: undefined },
    };
  }
  if (
    entry.kind !== 'record' ||
    (entry.record.kind !== 'finding' && entry.record.kind !== 'prior_insight')
  ) {
    return entry;
  }
  const scope = displayScope(
    entry.record.scope,
    publication.document.universe.universeId,
  );
  return scope === entry.record.scope
    ? entry
    : { ...entry, record: { ...entry.record, scope } };
}

function withDetailInteraction(
  trigger: React.ReactElement,
  openDetails: () => void,
): React.ReactElement {
  const element = trigger as React.ReactElement<
    React.HTMLAttributes<HTMLElement>
  >;
  const { onClick, onKeyDown } = element.props;
  const nativeInteraction =
    typeof element.type === 'string' &&
    ['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(
      element.type,
    );
  return React.cloneElement(element, {
    ...(!element.props.role && !nativeInteraction ? { role: 'button' } : {}),
    onClick(event) {
      onClick?.(event);
      if (!event.defaultPrevented) openDetails();
    },
    onKeyDown(event) {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        event.repeat ||
        (event.key !== 'Enter' && event.key !== ' ')
      ) {
        return;
      }
      event.preventDefault();
      openDetails();
    },
  });
}

/**
 * The single MyST host adapter around astra-ui's positioning-agnostic preview.
 * It supplies verified assets, resolved citations, nested previews and portal
 * brand/scheme scope without duplicating any record-card implementation.
 */
export function AstraPreviewPopover({
  publication,
  entry,
  trigger,
  triggerClassName = 'astra-ref-trigger',
  openDetailsOnTrigger = true,
}: AstraPreviewPopoverProps) {
  const scheme = useAstraColorScheme();
  const details = useAstraPublicationDetails();
  const renderArtifact = React.useMemo(
    () => createAstraArtifactRenderer(publication),
    [publication],
  );
  const renderRecordReference = React.useCallback<RecordPreviewReferenceRenderer>(
    ({ target, trigger: relatedTrigger }) => (
      <AstraPreviewPopover
        publication={publication}
        entry={{ kind: 'record', ...target }}
        trigger={relatedTrigger}
        triggerClassName=""
        openDetailsOnTrigger={false}
      />
    ),
    [publication],
  );
  const kind = entryKind(entry);
  const previewEntry = entryForPreview(publication, entry);
  const wrappedTrigger = triggerClassName ? (
    <span className={triggerClassName}>{trigger}</span>
  ) : (
    trigger
  );
  const opensRecord = entry.kind !== 'analysis' && details
    ? () => details.onOpenRecord(entry.record, entry.analysis)
    : undefined;
  const detailTrigger = openDetailsOnTrigger && opensRecord
    ? withDetailInteraction(wrappedTrigger, opensRecord)
    : wrappedTrigger;

  return (
    <PreviewPopover
      trigger={detailTrigger}
      kind={kind}
      label={`${entryTitle(entry)} ${kind.replace('_', ' ')} preview`}
      portalProps={{
        className: 'lightcone-brand',
        'data-entry-kind': entry.kind,
        'data-value-product':
          entry.kind === 'value' && entry.product ? '' : undefined,
        'data-lightcone-color-scheme': scheme,
        'data-astra-color-scheme': scheme,
      }}
    >
      <LabelsProvider labels={PREVIEW_LABELS}>
        <RecordPreview
          entry={previewEntry}
          document={publication.document}
          index={publication.index}
          renderArtifact={renderArtifact}
          renderCitation={(doi) => <AstraPreviewCite doi={doi} />}
          renderRecordReference={renderRecordReference}
          onOpenRecord={details?.onOpenRecord}
        />
      </LabelsProvider>
    </PreviewPopover>
  );
}
