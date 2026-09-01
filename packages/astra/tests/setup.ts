import '@testing-library/jest-dom/vitest';

// jsdom exposes <dialog> but not its modal lifecycle. Keep the shim narrowly
// faithful to the pieces astra-ui uses so detail handoff tests exercise the
// real RecordDialog rather than mocking the shared package.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
  }
}
