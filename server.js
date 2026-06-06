// Production server for the astra-theme MyST site template.
// Serves the compiled Remix build (./build + ./public) over Express — this is
// what `myst start` runs (template.yml → build.start → npm start → node ./server.js).
const path = require('path');
const express = require('express');
const getPort = require('get-port');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@remix-run/express');
const { installGlobals } = require('@remix-run/node');

installGlobals();

const BUILD_DIR = path.join(process.cwd(), 'build');

const app = express();
app.use(compression());
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/myst_assets_folder', express.static('public/build', { immutable: true, maxAge: '1y' }));
// Everything else (favicon, thebe assets, etc.) cached for an hour.
app.use(express.static('public', { maxAge: '1h' }));

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
  app.listen(port, host, () => {
    console.log(`astra-theme server started at http://${host}:${port}`);
  });
}

start();
