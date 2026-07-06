const mystTheme = require('@myst-theme/styles');

// The stock globs assume node_modules sits next to the theme; in this
// workspace it is hoisted to the repo root, so rebase those globs two levels
// up. The ASTRA overlay (packages/astra) is scanned as well — its components
// use Tailwind classes that must end up in this theme's stylesheet.
const content = [
  ...mystTheme.content,
  ...mystTheme.content
    .filter((glob) => glob.startsWith('node_modules'))
    .map((glob) => `../../${glob}`),
  '../../packages/astra/src/**/*.{js,ts,jsx,tsx}',
];

module.exports = {
  darkMode: 'class',
  content,
  theme: {
    extend: mystTheme.themeExtensions,
  },
  plugins: [require('@tailwindcss/typography')],
  safelist: mystTheme.safeList,
};
