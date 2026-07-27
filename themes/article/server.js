// Production server for this astra MyST site template. Serves the compiled
// Remix build (build/ + public/, resolved from the working directory) over
// Express — this is what `myst start` runs (template.yml → build.start →
// npm start → node ./server.js).
const path = require('path');
const fs = require('fs');
const express = require('express');
const getPort = require('get-port');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@remix-run/express');
const { installGlobals } = require('@remix-run/node');

installGlobals();

const BUILD_DIR = path.join(process.cwd(), 'build');
const STATIC_INVENTORY_DIR = path.join(process.cwd(), 'public', 'inventory');
const STATIC_INVENTORY_PATH = path.join(STATIC_INVENTORY_DIR, 'index.html');

// `myst build --html` only requests authored MyST page routes. The inventory
// is a theme route backed by index.md, so pre-render it into public/ while the
// static Remix server is running; MyST copies public/ into the final artifact
// after it stops this server. Clear the generated directory first so an older
// or interrupted build cannot leave stale inventory HTML ahead of Remix.
if (process.env.MODE === 'static') {
  fs.rmSync(STATIC_INVENTORY_DIR, { recursive: true, force: true });
}

const app = express();
app.use(compression());
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/myst_assets_folder', express.static('public/build', { immutable: true, maxAge: '1y' }));
// Everything else (favicon, thebe assets, etc.) cached for an hour.
const servePublic = express.static('public', { maxAge: '1h' });
app.use((req, res, next) => {
  // The inventory is a Remix route while this server is running. An ignored
  // static export left by a prior build must never shadow it.
  if (req.path === '/inventory' || req.path.startsWith('/inventory/')) {
    next();
    return;
  }
  servePublic(req, res, next);
});

app.use(morgan('tiny'));

app.all(
  '*',
  createRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV,
  }),
);

async function start() {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || (await getPort({ port: getPort.makeRange(3000, 3100) }));
  app.listen(port, host, async () => {
    if (process.env.MODE === 'static') {
      const requestHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
      try {
        // The generated file is served as the directory URL `/inventory/`.
        // Render with that same canonical pathname so Remix hydration does not
        // see `/inventory` in its server state and reload forever after the
        // static host redirects to `/inventory/`.
        const response = await fetch(`http://${requestHost}:${port}/inventory/`);
        if (!response.ok) {
          throw new Error(`inventory route returned ${response.status}`);
        }
        fs.mkdirSync(STATIC_INVENTORY_DIR, { recursive: true });
        fs.writeFileSync(STATIC_INVENTORY_PATH, await response.text());
      } catch (error) {
        console.warn(`Could not pre-render the ASTRA inventory route: ${error}`);
      }
    }
    console.log(`astra-theme server started at http://${host}:${port}`);
  });
}

start();
