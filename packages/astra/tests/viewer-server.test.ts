// @vitest-environment node
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';

const processes: ChildProcess[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    processes.splice(0).map(
      (process) =>
        new Promise<void>((resolve) => {
          if (process.exitCode !== null || process.signalCode !== null) return resolve();
          process.once('exit', () => resolve());
          process.kill();
        })
    )
  );
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

it.each(['article', 'book'])(
  '%s prefixes embedded asset URLs and preserves standalone files',
  async (theme) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'astra-viewer-assets-'));
    directories.push(directory);
    await mkdir(path.join(directory, 'build'));
    await mkdir(path.join(directory, 'public/build/_shared'), { recursive: true });
    // Only asset transport is under test; no content server or built publication is needed.
    await writeFile(
      path.join(directory, 'build/index.js'),
      `module.exports = {
    entry: { module: {} }, future: {}, assets: { routes: { root: {} } }, routes: { root: { id: 'root', path: '', module: {} } }
  };`
    );
    const javascript =
      'import "/myst_assets_folder/_shared/chunk.js"; export const css="/myst_assets_folder/style.css"; export const remote="https://example.org/image.png";';
    const css = '@font-face{src:url(/myst_assets_folder/font.woff2)}';
    const largeJavascript = javascript + '\n/*' + 'padding '.repeat(300) + '*/';
    await writeFile(path.join(directory, 'public/build/entry.js'), javascript);
    await writeFile(path.join(directory, 'public/build/large.js'), largeJavascript);
    await writeFile(
      path.join(directory, 'public/build/_shared/chunk.js'),
      'export const ready=true;'
    );
    await writeFile(path.join(directory, 'public/build/style.css'), css);
    await writeFile(path.join(directory, 'public/build/font.woff2'), Buffer.from([0, 1, 2, 255]));

    for (const prefix of ['/user/alice%40lab/viewer/site', '']) {
      // PORT=0 lets the OS assign a free port at bind time; the server reports the one
      // it got. Choosing a port up front and binding it later races the parallel case.
      const env: NodeJS.ProcessEnv = { ...process.env, HOST: '127.0.0.1', PORT: '0' };
      // Keep standalone verification independent of the invoking shell's viewer configuration.
      for (const key of ['MYSTRA_BASE_URL', 'MYSTRA_CONTENT_URL', 'MYSTRA_RELOAD_URL'])
        delete env[key];
      if (prefix)
        Object.assign(env, {
          MYSTRA_BASE_URL: prefix,
          MYSTRA_CONTENT_URL: '/viewer/content',
          MYSTRA_RELOAD_URL: '/viewer/socket',
        });
      const server = spawn(process.execPath, [path.resolve(`themes/${theme}/server.js`)], {
        cwd: directory,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      processes.push(server);
      const port = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Theme server did not start')), 10000);
        let logs = '';
        server.stderr!.on('data', (chunk) => {
          logs += chunk;
        });
        server.stdout!.on('data', (chunk) => {
          logs += chunk;
          const started = /server started at http:\/\/[^:\s]+:(\d+)/.exec(logs);
          if (started) {
            clearTimeout(timer);
            resolve(Number(started[1]));
          }
        });
        server.once('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        server.once('exit', (code) => {
          clearTimeout(timer);
          reject(new Error(`Theme exited: ${code}\n${logs}`));
        });
      });
      const base = `http://127.0.0.1:${port}${prefix}/myst_assets_folder`;
      // Repeated requests exercise the per-session asset cache.
      for (let reload = 0; reload < 2; reload++) {
        const response = await fetch(`${base}/entry.js`);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('javascript');
        expect(response.headers.get('cache-control')).toContain('immutable');
        const source = await response.text();
        expect(source).toBe(
          `import "${prefix}/myst_assets_folder/_shared/chunk.js"; export const css="${prefix}/myst_assets_folder/style.css"; export const remote="https://example.org/image.png";`
        );
        const dependency = /import "([^"]+)"/.exec(source)![1];
        expect(await (await fetch(`http://127.0.0.1:${port}${dependency}`)).text()).toBe(
          'export const ready=true;'
        );
      }
      if (prefix) {
        expect((await fetch(`${base}/foo.js%00.css`)).status).toBe(404);
        expect((await fetch(`${base}/..%2f..%2fserver.js`)).status).toBe(404);
      }
      const compressed = await fetch(`${base}/large.js`, {
        headers: { 'Accept-Encoding': 'gzip' },
      });
      expect(compressed.headers.get('content-encoding')).toBe('gzip');
      expect(await compressed.text()).toContain(
        `import "${prefix}/myst_assets_folder/_shared/chunk.js"`
      );
      expect(await (await fetch(`${base}/style.css`)).text()).toBe(
        `@font-face{src:url(${prefix}/myst_assets_folder/font.woff2)}`
      );
      expect(Buffer.from(await (await fetch(`${base}/font.woff2`)).arrayBuffer())).toEqual(
        Buffer.from([0, 1, 2, 255])
      );
    }
    expect(await readFile(path.join(directory, 'public/build/entry.js'), 'utf8')).toBe(javascript);
    expect(await readFile(path.join(directory, 'public/build/style.css'), 'utf8')).toBe(css);
  },
  30000
);
