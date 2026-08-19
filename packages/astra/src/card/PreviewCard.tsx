import * as React from 'react';
import { labelFor } from '../glyphs';
import {
  useFloating,
  useHover,
  useFocus,
  useClientPoint,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  arrow,
  safePolygon,
  FloatingPortal,
  FloatingArrow,
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
} from '@floating-ui/react';

export interface PreviewCardProps {
  /** The inline token that the card hangs off of (the reference span/text). */
  trigger: React.ReactNode;
  /** The card body — typically <CardChrome.* /> + diagrams. */
  children: React.ReactNode;
  /** ASTRA kind string, used to tint the card via `astra-card--<kind>`. */
  kind: string;
  /** Optional shared-detail activation for clickable publication references. */
  onActivate?: () => void;
}

const ARROW_HEIGHT = 7;
const GAP = 6;

/**
 * Floating-ui hover/focus popover. The trigger is rendered inline (a `<span>`
 * that wraps `trigger`); on hover or keyboard focus a floating panel with class
 * `astra-card astra-card--<kind>` is portaled into the document and positioned
 * with offset/flip/shift + a small arrow. Fully keyboard accessible (focus to
 * open, Escape / blur to dismiss) and announced as a tooltip.
 *
 * Cards NEST: a card body may contain further PreviewCard triggers (e.g. the
 * decision card's SUPPORTED BY insight chips). Each card registers in a
 * floating-ui FloatingTree (the outermost one creates it), so hovering a child
 * card keeps every ancestor card open instead of unmounting the chain.
 */
const PreviewCardInner: React.FC<PreviewCardProps> = ({ trigger, children, kind, onActivate }) => {
  const [open, setOpen] = React.useState(false);
  const arrowRef = React.useRef<SVGSVGElement>(null);
  const nodeId = useFloatingNodeId();

  // The pointer's x over the trigger, sampled continuously while hovering and
  // FROZEN into `pinnedX` at the moment the card opens — the card appears at
  // the cursor but does not follow it afterwards. A null pin (keyboard-focus
  // open) makes useClientPoint fall back to the token's own rect.
  const cursorXRef = React.useRef<number | null>(null);
  const [pinnedX, setPinnedX] = React.useState<number | null>(null);

  const { refs, floatingStyles, context, placement } = useFloating({
    nodeId,
    open,
    onOpenChange(nextOpen, event) {
      if (nextOpen) {
        setPinnedX(event instanceof MouseEvent ? cursorXRef.current : null);
      }
      setOpen(nextOpen);
    },
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // Cap the card at the space actually available between the trigger and
      // the viewport edge — a long decision rationale otherwise pushes the
      // card's top off-screen where it can't be read or reached (hovering
      // away closes the card). The cap lands on a CSS var so the card's inner
      // scroll region (`.astra-card__scroll`) absorbs the overflow while the
      // arrow stays pinned to the card edge.
      size({
        padding: 12,
        apply({ availableHeight, elements }) {
          elements.floating.style.setProperty(
            '--astra-card-max-h',
            `${Math.max(180, availableHeight)}px`,
          );
        },
      }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    delay: { open: 120, close: 60 },
    handleClose: safePolygon({ buffer: 1 }),
    move: false,
  });
  const focus = useFocus(context);
  // Anchor the card at the pointer's x rather than the token's center: long
  // references (and wrapped ones) otherwise open the card far from the cursor.
  // axis 'x' keeps the vertical anchor on the text line so flip/shift and the
  // arrow behave as before. Passing an explicit `x` (the frozen pin) disables
  // useClientPoint's follow-the-mouse listener — the card holds still.
  const clientPoint = useClientPoint(context, { axis: 'x', x: pinnedX });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    clientPoint,
    dismiss,
    role,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 120, close: 80 },
    initial: { opacity: 0, transform: 'scale(0.98)' },
  });

  return (
    <>
      <span
        ref={refs.setReference}
        tabIndex={0}
        className="astra-ref-trigger"
        role={onActivate ? 'button' : undefined}
        {...getReferenceProps({
          onClick: onActivate,
          onKeyDown: (event) => {
            if (onActivate && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onActivate();
            }
          },
          onMouseEnter: (e) => {
            cursorXRef.current = e.clientX;
          },
          onMouseMove: (e) => {
            cursorXRef.current = e.clientX;
          },
        })}
      >
        {trigger}
      </span>
      <FloatingNode id={nodeId}>
        {isMounted && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="astra-card-portal lightcone-brand"
              data-astra-color-scheme={
                typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
                  ? 'dark'
                  : 'light'
              }
              data-placement={placement}
              {...getFloatingProps()}
            >
              <div
                className={`astra-card astra-card--${kind}`}
                style={transitionStyles}
              >
                {/* The scroll region is a separate layer so a size-capped card
                    scrolls its body while the arrow (which protrudes past the
                    card edge) is never clipped by the overflow. */}
                <div className="astra-card__scroll">{children}</div>
                {/* Clickable references open the full record dialog; the card
                    (a glanceable miniature of that dialog) says so in a quiet
                    footer strip, pinned below the scroll region. The trigger
                    span is the accessible button — this footer is a redundant
                    pointer affordance, so it stays out of the tab order. */}
                {onActivate ? (
                  <button
                    type="button"
                    className="astra-card__open"
                    tabIndex={-1}
                    onClick={() => {
                      setOpen(false);
                      onActivate();
                    }}
                  >
                    <span className="astra-card__open-glyph" aria-hidden="true">
                      ⛶
                    </span>
                    <span>Click to open {labelFor(kind).toLowerCase()} record</span>
                  </button>
                ) : null}
                <FloatingArrow
                  ref={arrowRef}
                  context={context}
                  className="astra-card__arrow"
                  height={ARROW_HEIGHT}
                  width={ARROW_HEIGHT * 2}
                />
              </div>
            </div>
          </FloatingPortal>
        )}
      </FloatingNode>
    </>
  );
};

/**
 * Public entry: the outermost card creates the FloatingTree; nested cards
 * (rendered inside another card's floating body) attach to the existing tree.
 */
export const PreviewCard: React.FC<PreviewCardProps> = (props) => {
  const parentId = useFloatingParentNodeId();
  if (parentId === null) {
    return (
      <FloatingTree>
        <PreviewCardInner {...props} />
      </FloatingTree>
    );
  }
  return <PreviewCardInner {...props} />;
};

export default PreviewCard;
