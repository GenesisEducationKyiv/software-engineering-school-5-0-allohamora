/**
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  options: {
    exclude: 'node_modules',
  },
  forbidden: [
    {
      name: 'gateway-no-apps',
      comment: 'Gateway app should not depends on other apps',
      severity: 'error',
      from: { path: 'apps/gateway/' },
      to: { path: 'apps/', pathNot: 'apps/gateway/' },
    },
    {
      name: 'subscription-no-apps',
      comment: 'Subscription app should not depends on other apps',
      severity: 'error',
      from: { path: 'apps/subscription/' },
      to: { path: 'apps/', pathNot: 'apps/subscription/' },
    },
    {
      name: 'weather-no-apps',
      comment: 'Weather app should not depends on other apps',
      severity: 'error',
      from: { path: 'apps/weather/' },
      to: { path: 'apps/', pathNot: 'apps/weather/' },
    },
    {
      name: 'email-no-apps',
      comment: 'Email app should not depends on other apps',
      severity: 'error',
      from: { path: 'apps/email/' },
      to: { path: 'apps/', pathNot: 'apps/email/' },
    },
    {
      name: 'notification-no-apps',
      comment: 'Notification app should not depends on other apps',
      severity: 'error',
      from: { path: 'apps/notification/' },
      to: { path: 'apps/', pathNot: 'apps/notification/' },
    },
    {
      name: 'libs-no-apps',
      comment: 'Libs must not depend on apps',
      severity: 'error',
      from: { path: '^libs/' },
      to: { path: '^apps/' },
    },
    {
      name: 'packages-no-apps',
      comment: 'Packages should not depend on apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'packages-no-libs',
      comment: 'Packages should not depend on libs',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^libs/' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
};
