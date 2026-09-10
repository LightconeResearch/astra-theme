// Production server for this astra MyST site template. Serves the compiled
// Remix build (build/ + public/, resolved from the working directory) over
// Express — this is what `myst start` runs (template.yml → build.start →
// npm start → node ./server.js). Kept byte-identical in themes/article and
// themes/book.
const path = require('path');
const { readFile } = require('fs/promises');
const express = require('express');
const getPort = require('get-port');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@remix-run/express');
const { installGlobals } = require('@remix-run/node');

installGlobals();

const BUILD_DIR = path.join(process.cwd(), 'build');

// MySTRA viewer embedding (README "Embedding in MySTRA Viewer"): the public
// site prefix becomes a literal root route in Remix's server and browser
// manifests, so the compiled build and runtime stay untouched. The prefix is
// used verbatim in Express paths, so the character class must stay regex-safe;
// JupyterHub percent-encodes usernames except '@' and '~'.
const prefix = process.env.MYSTRA_BASE_URL || '';
const content = process.env.MYSTRA_CONTENT_URL || '';
if (
  prefix &&
  (!/^\/(?:[\w.~%@-]+\/)*[\w.~%@-]+$/.test(prefix) || !content || !process.env.MYSTRA_RELOAD_URL)
) {
  throw new Error(
    'MYSTRA_BASE_URL must be an absolute path without a trailing slash, set together with MYSTRA_CONTENT_URL and MYSTRA_RELOAD_URL',
  );
}
// The compiled build exposes read-only exports; copy it so the prefixed
// manifest and routes can replace the originals.
const build = { ...require(BUILD_DIR) };
const app = express();

if (prefix) {
  // Remix matches decoded pathnames against route paths; Express matches raw ones.
  const rootPath = decodeURI(prefix).slice(1);
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
  const assets = publicAsset(build.assets);
  assets.routes.root.path = rootPath;
  assets.url = prefix + '/mystra-manifest.js';
  const routes = {};
  for (const [id, route] of Object.entries(build.routes)) {
    const module = { ...route.module };
    if (module.links) module.links = (...args) => publicAsset(route.module.links(...args));
    for (const verb of ['loader', 'action']) {
      if (!module[verb]) continue;
      const handler = route.module[verb];
      // Route handlers see site-relative URLs and emit site-relative redirects.
      const relocate = (response) => {
        const location = response instanceof Response && response.headers.get('Location');
        if (
          location &&
          /^\/(?!\/)/.test(location) &&
          !location.startsWith(prefix + '/') &&
          !location.startsWith(content + '/')
        )
          response.headers.set('Location', prefix + location);
        return response;
      };
      module[verb] = async (args) => {
        const url = new URL(args.request.url);
        if (url.pathname.startsWith(prefix)) url.pathname = url.pathname.slice(prefix.length) || '/';
        try {
          return relocate(await handler({ ...args, request: new Request(url, args.request) }));
        } catch (error) {
          throw relocate(error);
        }
      };
    }
    routes[id] = { ...route, module, ...(id === 'root' ? { path: rootPath } : {}) };
  }
  build.assets = assets;
  build.routes = routes;

  app.get(prefix + '/mystra-capabilities', (_req, res) => {
    res.json({ protocol: 'mystra-viewer.v1', baseUrl: prefix });
  });
  app.get(assets.url, (_req, res) => {
    res
      .type('application/javascript')
      .set('Cache-Control', 'no-store')
      .send('window.__remixManifest=' + JSON.stringify(assets) + ';');
  });
  // The import map covers module imports; font and image URLs inside the
  // compiled stylesheets need the prefix too. The files on disk stay unchanged.
  const assetRoot = path.resolve('public/build');
  const styles = new Map();
  app.get(prefix + '/myst_assets_folder/*.css', async (req, res, next) => {
    const filename = path.resolve(assetRoot, req.params[0] + '.css');
    if (!filename.startsWith(assetRoot + path.sep)) return res.sendStatus(404);
    try {
      if (!styles.has(filename)) {
        const css = await readFile(filename, 'utf8');
        styles.set(filename, css.replaceAll('/myst_assets_folder/', prefix + '/myst_assets_folder/'));
      }
      res.type('text/css').set('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(styles.get(filename));
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return next();
      next(error);
    }
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
