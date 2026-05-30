import * as React from 'react';
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  safePolygon,
  FloatingPortal,
  FloatingArrow,
} from '@floating-ui/react';

export interface PreviewCardProps {
  /** The inline token that the card hangs off of (the reference span/text). */
  trigger: React.ReactNode;
  /** The card body — typically <CardChrome.* /> + diagrams. */
  children: React.ReactNode;
  /** ASTRA kind string, used to tint the card via `astra-card--<kind>`. */
  kind: string;
}

const ARROW_HEIGHT = 7;
const GAP = 6;

/**
 * Floating-ui hover/focus popover. The trigger is rendered inline (a `<span>`
 * that wraps `trigger`); on hover or keyboard focus a floating panel with class
 * `astra-card astra-card--<kind>` is portaled into the document and positioned
 * with offset/flip/shift + a small arrow. Fully keyboard accessible (focus to
 * open, Escape / blur to dismiss) and announced as a tooltip.
 */
export const PreviewCard: React.FC<PreviewCardProps> = ({ trigger, children, kind }) => {
  const [open, setOpen] = React.useState(false);
  const arrowRef = React.useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context, placement } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    delay: { open: 120, close: 60 },
    handleClose: safePolygon({ buffer: 1 }),
    move: false,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
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
        {...getReferenceProps()}
      >
        {trigger}
      </span>
      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="astra-card-portal"
            data-placement={placement}
            {...getFloatingProps()}
          >
            <div
              className={`astra-card astra-card--${kind}`}
              style={transitionStyles}
            >
              {children}
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
    </>
  );
};

export default PreviewCard;
