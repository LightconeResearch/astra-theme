/**
 * A pdf.js stand-in for the shared paper viewer, mirroring astra-ui's own DOM
 * test runtime: one string of text per page, instant rendering, and a text
 * layer that appends one span per item. jsdom lacks the observers and canvas
 * the viewer relies on, so `mockPdfBrowser()` stubs those before a test.
 */
import { vi } from 'vitest';
import type { PdfJs } from '@astra-spec/ui/lib';

interface TextContent {
  items: unknown[];
}

function textStrings(content: TextContent): string[] {
  return content.items.flatMap((item) =>
    typeof item === 'object' && item !== null && 'str' in item && typeof item.str === 'string'
      ? [item.str]
      : [],
  );
}

export function fakePdfRuntime(
  texts: string[] = ['S8 is lower than Planck.'],
  options: { fail?: Error } = {},
) {
  const destroy = vi.fn(async () => {});
  const pdf = {
    numPages: texts.length,
    getPage: vi.fn(async (page: number) => ({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 612 * scale,
        height: 792 * scale,
        scale,
      }),
      getTextContent: async (): Promise<TextContent> => ({
        items: [{ str: texts[page - 1] ?? '' }],
      }),
      render: () => ({ promise: Promise.resolve(), cancel() {} }),
    })),
  };
  const getDocument = vi.fn((_options: { url: string }) => ({
    promise: options.fail ? Promise.reject(options.fail) : Promise.resolve(pdf),
    destroy,
  }));
  class TextLayer {
    readonly textContentItemsStr: string[];
    readonly textDivs: HTMLElement[];
    constructor({ textContentSource, container }: { textContentSource: object; container: HTMLElement }) {
      this.textContentItemsStr = textStrings(textContentSource as TextContent);
      this.textDivs = this.textContentItemsStr.map((text) => {
        const span = document.createElement('span');
        span.textContent = text;
        container.append(span);
        return span;
      });
    }
    async render() {}
    cancel() {}
  }
  const load = vi.fn(async (): Promise<PdfJs> => ({ getDocument, TextLayer }));
  return { load, getDocument, destroy };
}

/** jsdom shims for the viewer: observers that never fire and an inert canvas. */
export function mockPdfBrowser() {
  if (typeof HTMLElement.prototype.scrollIntoView === 'function') {
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  } else {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D,
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
}
