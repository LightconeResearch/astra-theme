import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const serverDirectory = resolve(import.meta.dirname, '..', 'dist', 'server');
const workerPath = resolve(serverDirectory, 'index.js');

const worker = `/** Cloudflare Worker entry point for the static inventory lab. */
const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || request.method !== 'GET') {
      return response;
    }

    const fallback = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(fallback, request));
  },
};

export default worker;
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(workerPath, worker);
