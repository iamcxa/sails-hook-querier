module.exports = {
  reporter: [
    // 'json',
    // 'text',
    'text-summary',
    // 'html'
  ],
  'skip-full': true,
  exclude: ['.**.{js,json}', 'coverage/**', 'config/**/*.{js,json}', 'test/**/*.{js,json}'],
};
