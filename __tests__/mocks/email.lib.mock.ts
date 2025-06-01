vitest.mock('src/libs/email.lib.js', () => ({
  sendEmail: vitest.fn(),
}));
