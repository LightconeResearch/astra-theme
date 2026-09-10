import { useEffect } from 'react';

/** Prefix site-absolute hrefs with the viewer base URL; leave anchors, relative and external URLs alone. */
export function previewHref(href: string | undefined, baseurl?: string): string | undefined {
  return href && baseurl && href.startsWith('/') && !href.startsWith('//') ? baseurl + href : href;
}

/**
 * MyST's live-reload protocol over the host's authenticated WebSocket path
 * (the stock ContentReload can only reach a port on the page's hostname).
 * Reconnects with backoff so a stopped session does not hammer the host.
 */
export function PreviewReload({ url }: { url: string }) {
  useEffect(() => {
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    const connect = () => {
      socket = new WebSocket(new URL(url, location.href).href.replace(/^http/, 'ws'));
      socket.onopen = () => {
        delay = 1000;
      };
      socket.onmessage = (event) => {
        if (JSON.parse(event.data).type === 'RELOAD') location.reload();
      };
      socket.onclose = () => {
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30000);
      };
    };
    connect();
    return () => {
      clearTimeout(retry);
      if (socket) socket.onclose = null;
      socket?.close();
    };
  }, [url]);
  return null;
}
