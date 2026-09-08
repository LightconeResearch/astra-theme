import { useEffect } from 'react';

/** Prefix only local absolute navigation; preserve anchors and external URLs. */
export function previewHref(href: string | undefined, baseurl?: string): string | undefined {
  const base = baseurl?.replace(/\/$/, '');
  if (
    !href ||
    !base ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href === base ||
    href.startsWith(base + '/')
  )
    return href;
  return base + href;
}

/** Follow MyST's reload protocol through an authenticated public WebSocket URL. */
export function PreviewReload({ url }: { url: string }) {
  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let connected = false;
    const key = 'mystra-scroll:' + location.pathname;
    const saved = sessionStorage.getItem(key);
    if (saved !== null) {
      sessionStorage.removeItem(key);
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
    }
    const reload = () => {
      sessionStorage.setItem(key, String(window.scrollY));
      location.reload();
    };
    const connect = () => {
      const target = new URL(url, location.href);
      target.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(target);
      socket.onopen = () => {
        if (connected) reload();
        connected = true;
      };
      socket.onmessage = (event) => {
        try {
          if (JSON.parse(event.data).type === 'RELOAD') reload();
        } catch {
          /* Ignore messages outside MyST's JSON reload protocol. */
        }
      };
      socket.onclose = () => {
        if (!disposed) retry = setTimeout(connect, 1000);
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, [url]);
  return null;
}
