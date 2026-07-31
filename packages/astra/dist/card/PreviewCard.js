import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useFloating, useHover, useFocus, useClientPoint, useDismiss, useRole, useInteractions, useTransitionStyles, autoUpdate, offset, flip, shift, size, arrow, safePolygon, FloatingPortal, FloatingArrow, FloatingNode, FloatingTree, useFloatingNodeId, useFloatingParentNodeId, } from '@floating-ui/react';
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
const PreviewCardInner = ({ trigger, children, kind, onActivate, }) => {
    const [open, setOpen] = React.useState(false);
    const arrowRef = React.useRef(null);
    const nodeId = useFloatingNodeId();
    // The pointer's x over the trigger, sampled continuously while hovering and
    // FROZEN into `pinnedX` at the moment the card opens — the card appears at
    // the cursor but does not follow it afterwards. A null pin (keyboard-focus
    // open) makes useClientPoint fall back to the token's own rect.
    const cursorXRef = React.useRef(null);
    const [pinnedX, setPinnedX] = React.useState(null);
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
                    elements.floating.style.setProperty('--astra-card-max-h', `${Math.max(180, availableHeight)}px`);
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
    return (_jsxs(_Fragment, { children: [_jsx("span", { ref: refs.setReference, tabIndex: 0, role: onActivate ? 'button' : undefined, className: "astra-ref-trigger", ...getReferenceProps({
                    onClick: onActivate,
                    onKeyDown: (event) => {
                        if (onActivate
                            && (event.key === 'Enter' || event.key === ' ')) {
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
                }), children: trigger }), _jsx(FloatingNode, { id: nodeId, children: isMounted && (_jsx(FloatingPortal, { children: _jsx("div", { ref: refs.setFloating, style: floatingStyles, className: "astra-card-portal", "data-placement": placement, ...getFloatingProps(), children: _jsxs("div", { className: `astra-card astra-card--${kind}`, style: transitionStyles, children: [_jsx("div", { className: "astra-card__scroll", children: children }), _jsx(FloatingArrow, { ref: arrowRef, context: context, className: "astra-card__arrow", height: ARROW_HEIGHT, width: ARROW_HEIGHT * 2 })] }) }) })) })] }));
};
/**
 * Public entry: the outermost card creates the FloatingTree; nested cards
 * (rendered inside another card's floating body) attach to the existing tree.
 */
export const PreviewCard = (props) => {
    const parentId = useFloatingParentNodeId();
    if (parentId === null) {
        return (_jsx(FloatingTree, { children: _jsx(PreviewCardInner, { ...props }) }));
    }
    return _jsx(PreviewCardInner, { ...props });
};
export default PreviewCard;
//# sourceMappingURL=PreviewCard.js.map