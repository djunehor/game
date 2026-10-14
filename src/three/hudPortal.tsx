import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { createContext, useContext } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// ---------------------------------------------------------------------------
// A stable portal container for every in-world HTML overlay.
//
// drei's <Html> creates a ReactDOM root per instance and, on unmount, removes
// its element from whichever target it resolved at mount. Two things go wrong:
//
//  1. That target can change under it (`events.connected` is set after the
//     first render), so every overlay is torn down and rebuilt once mid-render.
//  2. When an overlay later unmounts, the cleanup calls removeChild on a node
//     that has since moved. React surfaces this as
//     "NotFoundError: removeChild ... not a child of this node", which became
//     reachable once Sims started unmounting during play (a visitor leaving, an
//     elder passing on).
//
// Pinning every overlay to one container fixes both — but the container must
// NOT be one React manages, or React's own deletion pass fights with drei's
// cleanup over the same children. So we create it imperatively and hand it over
// as a plain ref.
// ---------------------------------------------------------------------------

const HudPortalContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function HudPortalProvider({ children }: { children: ReactNode }) {
  const gl = useThree((s) => s.gl);
  const portal = useRef<HTMLElement | null>(null);

  // Created once per canvas, outside React's reconciliation.
  const container = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.setAttribute('data-hud-portal', '');
    el.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;';
    return el;
  }, []);

  // Assign during render, not in an effect: the overlay children mount in the
  // same commit, and if the portal is still null on their first pass they bind
  // to drei's fallback target and then move — which is precisely the mismatch
  // that throws on teardown.
  if (container) portal.current = container;

  useLayoutEffect(() => {
    const parent = gl.domElement.parentNode as HTMLElement | null;
    if (!container || !parent) return;
    parent.appendChild(container);
    // Deliberately not removed on unmount: React must never try to delete our
    // children. The container goes with the canvas parent when it is discarded.
  }, [container, gl]);

  return <HudPortalContext.Provider value={portal}>{children}</HudPortalContext.Provider>;
}

/**
 * Drop-in replacement for drei's <Html> that renders into the stable container
 * when one is available, and falls back to drei's own behaviour otherwise.
 */
export function HudHtml(props: React.ComponentProps<typeof Html>) {
  const portal = useContext(HudPortalContext);
  if (portal?.current) return <Html {...props} portal={portal as RefObject<HTMLElement>} />;
  return <Html {...props} />;
}
