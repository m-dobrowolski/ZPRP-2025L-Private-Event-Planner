// next-i18next.config.js
const path = require('path');

module.exports = {
  debug: process.env.NODE_ENV === 'development',
  i18n: {
    locales: ['en', 'pl'],
    defaultLocale: 'en',
  },
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',

  defaultNS: 'translation'
};