import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreviewReload, previewHref } from '../src/viewerTransport';

class TestSocket {
  static instances: TestSocket[] = [];
  onopen?: () => void;
  onclose?: () => void;
  close = vi.fn();
  constructor(readonly url: URL) {
    TestSocket.instances.push(this);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestSocket.instances = [];
});

describe('viewer navigation', () => {
  it('prefixes local links once and preserves external links and anchors', () => {
    const base = '/user/alice/viewer/site';
    expect(previewHref('/reconstruction#decision-a', base)).toBe(
      base + '/reconstruction#decision-a',
    );
    expect(previewHref(base + '/reconstruction', base)).toBe(base + '/reconstruction');
    for (const value of [
      '#decision-a',
      'https://example.org/a',
      '//example.org/a',
      'relative',
      undefined,
    ]) {
      expect(previewHref(value, base)).toBe(value);
    }
    expect(previewHref('/reconstruction')).toBe('/reconstruction');
  });
});

describe('viewer reload connection', () => {
  it('uses the public path and disposes pending reconnects', () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', TestSocket);
    const view = render(<PreviewReload url="/user/alice/viewer/socket" />);
    const first = TestSocket.instances[0];
    expect(first.url.pathname).toBe('/user/alice/viewer/socket');
    expect(first.url.protocol).toBe('ws:');
    act(() => first.onclose?.());
    act(() => vi.advanceTimersByTime(1000));
    expect(TestSocket.instances).toHaveLength(2);
    const second = TestSocket.instances[1];
    act(() => second.onclose?.());
    view.unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(second.close).toHaveBeenCalledOnce();
    expect(TestSocket.instances).toHaveLength(2);
  });
});
