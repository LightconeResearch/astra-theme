const mystTheme = require('@myst-theme/styles');

// The stock globs assume node_modules sits next to the theme; in this
// workspace it is hoisted to the repo root, so rebase those globs two levels up.
const content = [
  ...mystTheme.content,
  ...mystTheme.content
    .filter((glob) => glob.startsWith('node_modules'))
    .map((glob) => `../../${glob}`),
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
