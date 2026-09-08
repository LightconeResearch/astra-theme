// Production server for this astra MyST site template. Serves the compiled
// Remix build (build/ + public/, resolved from the working directory) over
// Express — this is what `myst start` runs (template.yml → build.start →
// npm start → node ./server.js). Kept byte-identical in themes/article and
// themes/book.
const path = require('path');
const express = require('express');
const getPort = require('get-port');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@remix-run/express');
const { installGlobals } = require('@remix-run/node');

installGlobals();

const BUILD_DIR = path.join(process.cwd(), 'build');

// The optional viewer prefix is a literal root route shared by Remix's server
// and browser manifests. This avoids changing or forking the Remix runtime.
const prefix = (process.env.MYSTRA_BASE_URL || '').replace(/\/$/, '');
if (prefix && !/^\/(?:[a-zA-Z0-9_.~%+-]+\/)*[a-zA-Z0-9_.~%+-]+$/.test(prefix)) {
  throw new Error('MYSTRA_BASE_URL must be an absolute URL path without query or fragment');
}
const original = require(BUILD_DIR);
const build = {
  ...original,
  assets: structuredClone(original.assets),
  routes: { ...original.routes },
};
if (prefix) {
  const publicAsset = (value) => {
    if (typeof value === 'string')
      return value.startsWith('/myst_assets_folder/') ? prefix + value : value;
    if (Array.isArray(value)) return value.map(publicAsset);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, publicAsset(item)]),
      );
    return value;
  };
  build.assets = publicAsset(build.assets);
  build.assets.routes.root.path = prefix.slice(1);
  build.assets.url = prefix + '/mystra-manifest.js';
  for (const [id, route] of Object.entries(build.routes)) {
    const module = { ...route.module };
    for (const verb of ['loader', 'action']) {
      if (!module[verb]) continue;
      const originalHandler = module[verb];
      module[verb] = async (args) => {
        const url = new URL(args.request.url);
        url.pathname = url.pathname.slice(prefix.length) || '/';
        const invoke = () => originalHandler({ ...args, request: new Request(url, args.request) });
        const relocate = (response) => {
          const location = response instanceof Response && response.headers.get('Location');
          if (
            location &&
            location.startsWith('/') &&
            !location.startsWith('//') &&
            location !== prefix &&
            !location.startsWith(prefix + '/') &&
            !location.startsWith((process.env.MYSTRA_CONTENT_URL || prefix) + '/')
          ) {
            response.headers.set('Location', prefix + location);
          }
          return response;
        };
        try {
          return relocate(await invoke());
        } catch (error) {
          throw relocate(error);
        }
      };
    }
    build.routes[id] = {
      ...route,
      module,
      ...(id === 'root' ? { path: prefix.slice(1) } : {}),
    };
  }
}

const app = express();
app.get(prefix + '/mystra-capabilities', (_req, res) => {
  res.json({ protocol: 'mystra-viewer.v1', baseUrl: prefix });
});
if (prefix) {
  app.get(build.assets.url, (_req, res) => {
    res
      .type('application/javascript')
      .set('Cache-Control', 'no-store')
      .send(
        'window.__remixManifest=' + JSON.stringify(build.assets).replace(/</g, '\\u003c') + ';',
      );
  });
}
app.use(compression());
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use(
  prefix + '/myst_assets_folder',
  express.static('public/build', { immutable: true, maxAge: '1y' }),
);
// Everything else (favicon, thebe assets, etc.) cached for an hour.
app.use(prefix || '/', express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

app.all(
  '*',
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  }),
);

async function start() {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || (await getPort({ port: getPort.makeRange(3000, 3100) }));
  app.listen(port, host, () => {
    console.log(`astra-theme server started at http://${host}:${port}`);
  });
}

start();
