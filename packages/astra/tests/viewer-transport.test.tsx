import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreviewReload, previewHref } from '../src/viewerTransport';

class TestSocket {
  static instances: TestSocket[] = [];
  onopen?: () => void;
  onclose?: (() => void) | null;
  onmessage?: (event: { data: string }) => void;
  close = vi.fn();
  constructor(readonly url: string) {
    TestSocket.instances.push(this);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestSocket.instances = [];
});

describe('viewer navigation', () => {
  it('prefixes site-absolute links and preserves external links and anchors', () => {
    const base = '/user/alice/viewer/site';
    expect(previewHref('/reconstruction#decision-a', base)).toBe(
      base + '/reconstruction#decision-a',
    );
    for (const value of ['#decision-a', 'https://example.org/a', '//example.org/a', 'relative']) {
      expect(previewHref(value, base)).toBe(value);
    }
    expect(previewHref(undefined, base)).toBeUndefined();
    expect(previewHref('/reconstruction')).toBe('/reconstruction');
  });
});

describe('viewer reload connection', () => {
  it('uses the public path, reloads on RELOAD, backs off and disposes reconnects', () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', TestSocket);
    const reload = vi.fn();
    vi.stubGlobal('location', { ...location, href: 'http://hub.test/lab', reload });
    const view = render(<PreviewReload url="/user/alice/viewer/socket" />);
    const [first] = TestSocket.instances;
    expect(first.url).toBe('ws://hub.test/user/alice/viewer/socket');
    act(() => first.onmessage?.({ data: JSON.stringify({ type: 'LOG' }) }));
    expect(reload).not.toHaveBeenCalled();
    act(() => first.onmessage?.({ data: JSON.stringify({ type: 'RELOAD' }) }));
    expect(reload).toHaveBeenCalledOnce();
    act(() => first.onclose?.());
    act(() => vi.advanceTimersByTime(1000));
    expect(TestSocket.instances).toHaveLength(2);
    act(() => TestSocket.instances[1].onclose?.());
    act(() => vi.advanceTimersByTime(1000));
    expect(TestSocket.instances).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(TestSocket.instances).toHaveLength(3);
    view.unmount();
    expect(TestSocket.instances[2].close).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(60000));
    expect(TestSocket.instances).toHaveLength(3);
  });
});
